from fastapi import APIRouter, Query, Depends, HTTPException
from typing import Annotated
from peewee import SqliteDatabase, Model, BooleanField, IntegerField
from api.database import get_database_fastapi
from api.models.api import ApiResponse
from api.models.category import Category, CategoryDB
from api.models.client import Client, ClientDB
from api.models.domain import Domain, DomainDB
from api.models.group import Group, GroupDB, AssociationCategories, AssociationClients
from api.models.metric import Metric, MetricDB
from api.models.statistic import Statistic, StatisticDB
from api.models.user import User, UserDB
from api.security import check_authorization
import logging


logger = logging.getLogger(__name__)


router = APIRouter(
    prefix="/database",
    tags=["database"],
    responses={404: {"description": "Not found"}},
)


# ---------------------------------------------------------------------------
# Shared helpers (filtering, pagination, ordering)
# ---------------------------------------------------------------------------


def convert_filter_value(field, value: str):
    """Convert a string filter value to the appropriate type based on the field type."""
    if isinstance(field, BooleanField):
        value_lower = value.lower().strip()
        if value_lower in ("1", "true", "yes", "on"):
            return True
        elif value_lower in ("0", "false", "no", "off"):
            return False
        try:
            return bool(int(value))
        except (ValueError, TypeError):
            raise ValueError(f"Cannot convert '{value}' to boolean")
    elif isinstance(field, IntegerField):
        try:
            return int(value)
        except (ValueError, TypeError):
            raise ValueError(f"Cannot convert '{value}' to integer")
    return value


def build_list_query(
    model_class: type[Model],
    page_number: int,
    items_per_page: int,
    order_by: str | None,
    filter_field: str | None,
    filter_value: str | None,
    filter_operator: str,
) -> tuple[list, int]:
    """
    Build a filtered, ordered, paginated query for any Peewee model.
    Returns (list of pydantic objects, total count).
    """
    base_query = model_class.select()

    # Apply filter
    if filter_field and filter_value:
        if not hasattr(model_class, filter_field):
            raise HTTPException(
                status_code=400,
                detail=f"Field '{filter_field}' does not exist in table '{model_class._meta.table_name}'",
            )
        field = getattr(model_class, filter_field)
        try:
            converted = convert_filter_value(field, filter_value)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

        ops = {
            "eq": lambda: field == converted,
            "ne": lambda: field != converted,
            "gt": lambda: field > converted,
            "lt": lambda: field < converted,
            "gte": lambda: field >= converted,
            "lte": lambda: field <= converted,
            "like": lambda: field.contains(converted),
        }
        if filter_operator == "in":
            values = []
            for v in filter_value.split(","):
                try:
                    values.append(convert_filter_value(field, v.strip()))
                except ValueError as e:
                    raise HTTPException(status_code=400, detail=str(e))
            base_query = base_query.where(field.in_(values))
        elif filter_operator in ops:
            base_query = base_query.where(ops[filter_operator]())
        else:
            raise HTTPException(
                status_code=400, detail=f"Invalid filter operator: {filter_operator}"
            )

    total = base_query.count()

    # Handle page 0 = last page
    if page_number == 0:
        page_number = max(1, (total - 1) // items_per_page + 1)

    # Ordering
    if order_by:
        desc_order = order_by.startswith("-")
        order_field = order_by.lstrip("-")
        if not hasattr(model_class, order_field):
            raise HTTPException(
                status_code=400,
                detail=f"Order field '{order_field}' does not exist",
            )
        attr = getattr(model_class, order_field)
        base_query = base_query.order_by(attr.desc() if desc_order else attr)
    else:
        base_query = base_query.order_by(model_class.id)

    # Pagination
    base_query = base_query.paginate(page_number, items_per_page)

    data = [obj.to_pydantic() for obj in base_query]
    return data, total


# Common query parameters used by every list endpoint
LIST_PARAMS = dict(
    page_number=(int, Query(title="Page number (0 = last page)", ge=0, default=1)),
    items_per_page=(int, Query(title="Items per page", ge=1, le=1000, default=100)),
    order_by=(str | None, Query(title="Order by field (prefix with - for desc)", pattern="^-?[a-zA-Z0-9_]+$", default=None)),
    filter_field=(str | None, Query(title="Field to filter on", pattern="^[a-zA-Z0-9_]+$", default=None)),
    filter_value=(str | None, Query(title="Value to filter by", default=None)),
    filter_operator=(str, Query(title="Filter operator", pattern="^(eq|ne|gt|lt|gte|lte|like|in)$", default="eq")),
)


# ============================================================================
# Client CRUD
# ============================================================================


@router.get("/client/")
async def list_clients(
    database: Annotated[SqliteDatabase, Depends(get_database_fastapi)],
    authorization: Annotated[str, Depends(check_authorization)],
    page_number: Annotated[int, Query(ge=0)] = 1,
    items_per_page: Annotated[int, Query(ge=1, le=1000)] = 100,
    order_by: Annotated[str | None, Query(pattern="^-?[a-zA-Z0-9_]+$")] = None,
    filter_field: Annotated[str | None, Query(pattern="^[a-zA-Z0-9_]+$")] = None,
    filter_value: Annotated[str | None, Query()] = None,
    filter_operator: Annotated[str, Query(pattern="^(eq|ne|gt|lt|gte|lte|like|in)$")] = "eq",
) -> ApiResponse:
    """List clients with optional filtering, pagination, and ordering."""
    data, total = build_list_query(
        ClientDB, page_number, items_per_page, order_by,
        filter_field, filter_value, filter_operator,
    )
    return ApiResponse(success=True, message=str(total), data=data)


@router.post("/client/")
async def create_client(
    client: Client,
    database: Annotated[SqliteDatabase, Depends(get_database_fastapi)],
    authorization: Annotated[str, Depends(check_authorization)],
) -> ApiResponse:
    """Create a new client."""
    new_obj = ClientDB.from_pydantic(client)
    new_obj.save(force_insert=True)
    return ApiResponse(success=True, message="Created successfully", data=new_obj.to_pydantic())


@router.put("/client/")
async def update_client(
    client: Client,
    database: Annotated[SqliteDatabase, Depends(get_database_fastapi)],
    authorization: Annotated[str, Depends(check_authorization)],
) -> ApiResponse:
    """Update an existing client by id."""
    if not client.id:
        raise HTTPException(status_code=400, detail="Client ID is required for update")
    if not ClientDB.get_or_none(ClientDB.id == client.id):
        raise HTTPException(status_code=404, detail=f"Client with id={client.id} not found")
    obj = ClientDB.from_pydantic(client)
    obj.save()
    return ApiResponse(success=True, message="Updated successfully", data=obj.to_pydantic())


@router.delete("/client/")
async def delete_client(
    database: Annotated[SqliteDatabase, Depends(get_database_fastapi)],
    authorization: Annotated[str, Depends(check_authorization)],
    id: Annotated[int, Query(title="Client ID to delete")] = None,
) -> ApiResponse:
    """Delete a client by id."""
    if id is None:
        raise HTTPException(status_code=400, detail="Client ID is required")
    existing = ClientDB.get_or_none(ClientDB.id == id)
    if not existing:
        raise HTTPException(status_code=404, detail=f"Client with id={id} not found")
    deleted_data = existing.to_pydantic()
    existing.delete_instance()
    return ApiResponse(success=True, message="Deleted successfully", data=deleted_data)


# ============================================================================
# Category CRUD
# ============================================================================


@router.get("/category/")
async def list_categories(
    database: Annotated[SqliteDatabase, Depends(get_database_fastapi)],
    authorization: Annotated[str, Depends(check_authorization)],
    page_number: Annotated[int, Query(ge=0)] = 1,
    items_per_page: Annotated[int, Query(ge=1, le=1000)] = 100,
    order_by: Annotated[str | None, Query(pattern="^-?[a-zA-Z0-9_]+$")] = None,
    filter_field: Annotated[str | None, Query(pattern="^[a-zA-Z0-9_]+$")] = None,
    filter_value: Annotated[str | None, Query()] = None,
    filter_operator: Annotated[str, Query(pattern="^(eq|ne|gt|lt|gte|lte|like|in)$")] = "eq",
) -> ApiResponse:
    """List categories with optional filtering, pagination, and ordering."""
    data, total = build_list_query(
        CategoryDB, page_number, items_per_page, order_by,
        filter_field, filter_value, filter_operator,
    )
    return ApiResponse(success=True, message=str(total), data=data)


@router.post("/category/")
async def create_category(
    category: Category,
    database: Annotated[SqliteDatabase, Depends(get_database_fastapi)],
    authorization: Annotated[str, Depends(check_authorization)],
) -> ApiResponse:
    """Create a new category."""
    new_obj = CategoryDB.from_pydantic(category)
    new_obj.save(force_insert=True)
    return ApiResponse(success=True, message="Created successfully", data=new_obj.to_pydantic())


@router.put("/category/")
async def update_category(
    category: Category,
    database: Annotated[SqliteDatabase, Depends(get_database_fastapi)],
    authorization: Annotated[str, Depends(check_authorization)],
) -> ApiResponse:
    """Update an existing category by id."""
    if not category.id:
        raise HTTPException(status_code=400, detail="Category ID is required for update")
    if not CategoryDB.get_or_none(CategoryDB.id == category.id):
        raise HTTPException(status_code=404, detail=f"Category with id={category.id} not found")
    obj = CategoryDB.from_pydantic(category)
    obj.save()
    return ApiResponse(success=True, message="Updated successfully", data=obj.to_pydantic())


@router.delete("/category/")
async def delete_category(
    database: Annotated[SqliteDatabase, Depends(get_database_fastapi)],
    authorization: Annotated[str, Depends(check_authorization)],
    id: Annotated[int, Query(title="Category ID to delete")] = None,
) -> ApiResponse:
    """Delete a category by id."""
    if id is None:
        raise HTTPException(status_code=400, detail="Category ID is required")
    existing = CategoryDB.get_or_none(CategoryDB.id == id)
    if not existing:
        raise HTTPException(status_code=404, detail=f"Category with id={id} not found")
    deleted_data = existing.to_pydantic()
    existing.delete_instance()
    return ApiResponse(success=True, message="Deleted successfully", data=deleted_data)


# ============================================================================
# Domain CRUD
# ============================================================================


@router.get("/domain/")
async def list_domains(
    database: Annotated[SqliteDatabase, Depends(get_database_fastapi)],
    authorization: Annotated[str, Depends(check_authorization)],
    page_number: Annotated[int, Query(ge=0)] = 1,
    items_per_page: Annotated[int, Query(ge=1, le=1000)] = 100,
    order_by: Annotated[str | None, Query(pattern="^-?[a-zA-Z0-9_]+$")] = None,
    filter_field: Annotated[str | None, Query(pattern="^[a-zA-Z0-9_]+$")] = None,
    filter_value: Annotated[str | None, Query()] = None,
    filter_operator: Annotated[str, Query(pattern="^(eq|ne|gt|lt|gte|lte|like|in)$")] = "eq",
) -> ApiResponse:
    """List domains with optional filtering, pagination, and ordering."""
    data, total = build_list_query(
        DomainDB, page_number, items_per_page, order_by,
        filter_field, filter_value, filter_operator,
    )
    return ApiResponse(success=True, message=str(total), data=data)


@router.post("/domain/")
async def create_domain(
    domain: Domain,
    database: Annotated[SqliteDatabase, Depends(get_database_fastapi)],
    authorization: Annotated[str, Depends(check_authorization)],
) -> ApiResponse:
    """Create a new domain. Validates that the referenced category exists."""
    # Validate FK
    if not CategoryDB.get_or_none(CategoryDB.id == domain.category_id):
        raise HTTPException(status_code=400, detail=f"Category with id={domain.category_id} not found")
    new_obj = DomainDB.from_pydantic(domain)
    new_obj.save(force_insert=True)
    return ApiResponse(success=True, message="Created successfully", data=new_obj.to_pydantic())


@router.put("/domain/")
async def update_domain(
    domain: Domain,
    database: Annotated[SqliteDatabase, Depends(get_database_fastapi)],
    authorization: Annotated[str, Depends(check_authorization)],
) -> ApiResponse:
    """Update an existing domain by id."""
    if not domain.id:
        raise HTTPException(status_code=400, detail="Domain ID is required for update")
    if not DomainDB.get_or_none(DomainDB.id == domain.id):
        raise HTTPException(status_code=404, detail=f"Domain with id={domain.id} not found")
    if not CategoryDB.get_or_none(CategoryDB.id == domain.category_id):
        raise HTTPException(status_code=400, detail=f"Category with id={domain.category_id} not found")
    obj = DomainDB.from_pydantic(domain)
    obj.save()
    return ApiResponse(success=True, message="Updated successfully", data=obj.to_pydantic())


@router.delete("/domain/")
async def delete_domain(
    database: Annotated[SqliteDatabase, Depends(get_database_fastapi)],
    authorization: Annotated[str, Depends(check_authorization)],
    id: Annotated[int, Query(title="Domain ID to delete")] = None,
) -> ApiResponse:
    """Delete a domain by id."""
    if id is None:
        raise HTTPException(status_code=400, detail="Domain ID is required")
    existing = DomainDB.get_or_none(DomainDB.id == id)
    if not existing:
        raise HTTPException(status_code=404, detail=f"Domain with id={id} not found")
    deleted_data = existing.to_pydantic()
    existing.delete_instance()
    return ApiResponse(success=True, message="Deleted successfully", data=deleted_data)


# ============================================================================
# Group CRUD (with M2M associations for categories and clients)
# ============================================================================


@router.get("/group/")
async def list_groups(
    database: Annotated[SqliteDatabase, Depends(get_database_fastapi)],
    authorization: Annotated[str, Depends(check_authorization)],
    page_number: Annotated[int, Query(ge=0)] = 1,
    items_per_page: Annotated[int, Query(ge=1, le=1000)] = 100,
    order_by: Annotated[str | None, Query(pattern="^-?[a-zA-Z0-9_]+$")] = None,
    filter_field: Annotated[str | None, Query(pattern="^[a-zA-Z0-9_]+$")] = None,
    filter_value: Annotated[str | None, Query()] = None,
    filter_operator: Annotated[str, Query(pattern="^(eq|ne|gt|lt|gte|lte|like|in)$")] = "eq",
) -> ApiResponse:
    """List groups with optional filtering, pagination, and ordering."""
    data, total = build_list_query(
        GroupDB, page_number, items_per_page, order_by,
        filter_field, filter_value, filter_operator,
    )
    return ApiResponse(success=True, message=str(total), data=data)


def _sync_group_associations(group_obj: GroupDB, category_ids: list[int], client_ids: list[int]):
    """Replace existing M2M associations for a group with the provided ids."""
    # Categories
    AssociationCategories.delete().where(AssociationCategories.group == group_obj).execute()
    for cat_id in category_ids:
        cat = CategoryDB.get_or_none(CategoryDB.id == cat_id)
        if cat:
            AssociationCategories.create(group=group_obj, category=cat)
        else:
            logger.warning(f"Category with id {cat_id} not found, skipping")

    # Clients
    AssociationClients.delete().where(AssociationClients.group == group_obj).execute()
    for cli_id in client_ids:
        cli = ClientDB.get_or_none(ClientDB.id == cli_id)
        if cli:
            AssociationClients.create(group=group_obj, client=cli)
        else:
            logger.warning(f"Client with id {cli_id} not found, skipping")


@router.post("/group/")
async def create_group(
    group: Group,
    database: Annotated[SqliteDatabase, Depends(get_database_fastapi)],
    authorization: Annotated[str, Depends(check_authorization)],
) -> ApiResponse:
    """Create a new group with category and client associations."""
    new_obj = GroupDB.create(name=group.name)
    _sync_group_associations(new_obj, group.categories_ids, group.clients_ids)
    return ApiResponse(success=True, message="Created successfully", data=new_obj.to_pydantic())


@router.put("/group/")
async def update_group(
    group: Group,
    database: Annotated[SqliteDatabase, Depends(get_database_fastapi)],
    authorization: Annotated[str, Depends(check_authorization)],
) -> ApiResponse:
    """Update an existing group by id, including its associations."""
    if not group.id:
        raise HTTPException(status_code=400, detail="Group ID is required for update")
    existing = GroupDB.get_or_none(GroupDB.id == group.id)
    if not existing:
        raise HTTPException(status_code=404, detail=f"Group with id={group.id} not found")

    # Update name
    existing.name = group.name
    existing.save()

    # Replace associations
    _sync_group_associations(existing, group.categories_ids, group.clients_ids)
    return ApiResponse(success=True, message="Updated successfully", data=existing.to_pydantic())


@router.delete("/group/")
async def delete_group(
    database: Annotated[SqliteDatabase, Depends(get_database_fastapi)],
    authorization: Annotated[str, Depends(check_authorization)],
    id: Annotated[int, Query(title="Group ID to delete")] = None,
) -> ApiResponse:
    """Delete a group by id, including its associations."""
    if id is None:
        raise HTTPException(status_code=400, detail="Group ID is required")
    existing = GroupDB.get_or_none(GroupDB.id == id)
    if not existing:
        raise HTTPException(status_code=404, detail=f"Group with id={id} not found")
    deleted_data = existing.to_pydantic()

    # Delete associations first
    AssociationCategories.delete().where(AssociationCategories.group == existing).execute()
    AssociationClients.delete().where(AssociationClients.group == existing).execute()
    existing.delete_instance()
    return ApiResponse(success=True, message="Deleted successfully", data=deleted_data)


# ============================================================================
# Metric CRUD
# ============================================================================


@router.get("/metric/")
async def list_metrics(
    database: Annotated[SqliteDatabase, Depends(get_database_fastapi)],
    authorization: Annotated[str, Depends(check_authorization)],
    page_number: Annotated[int, Query(ge=0)] = 1,
    items_per_page: Annotated[int, Query(ge=1, le=1000)] = 100,
    order_by: Annotated[str | None, Query(pattern="^-?[a-zA-Z0-9_]+$")] = None,
    filter_field: Annotated[str | None, Query(pattern="^[a-zA-Z0-9_]+$")] = None,
    filter_value: Annotated[str | None, Query()] = None,
    filter_operator: Annotated[str, Query(pattern="^(eq|ne|gt|lt|gte|lte|like|in)$")] = "eq",
) -> ApiResponse:
    """List metrics with optional filtering, pagination, and ordering."""
    data, total = build_list_query(
        MetricDB, page_number, items_per_page, order_by,
        filter_field, filter_value, filter_operator,
    )
    return ApiResponse(success=True, message=str(total), data=data)


@router.post("/metric/")
async def create_metric(
    metric: Metric,
    database: Annotated[SqliteDatabase, Depends(get_database_fastapi)],
    authorization: Annotated[str, Depends(check_authorization)],
) -> ApiResponse:
    """Create a new metric entry."""
    # Validate optional FK
    if metric.category_id and not CategoryDB.get_or_none(CategoryDB.id == metric.category_id):
        raise HTTPException(status_code=400, detail=f"Category with id={metric.category_id} not found")
    new_obj = MetricDB.from_pydantic(metric)
    new_obj.save(force_insert=True)
    return ApiResponse(success=True, message="Created successfully", data=new_obj.to_pydantic())


@router.put("/metric/")
async def update_metric(
    metric: Metric,
    database: Annotated[SqliteDatabase, Depends(get_database_fastapi)],
    authorization: Annotated[str, Depends(check_authorization)],
) -> ApiResponse:
    """Update an existing metric by id."""
    if not metric.id:
        raise HTTPException(status_code=400, detail="Metric ID is required for update")
    if not MetricDB.get_or_none(MetricDB.id == metric.id):
        raise HTTPException(status_code=404, detail=f"Metric with id={metric.id} not found")
    if metric.category_id and not CategoryDB.get_or_none(CategoryDB.id == metric.category_id):
        raise HTTPException(status_code=400, detail=f"Category with id={metric.category_id} not found")
    obj = MetricDB.from_pydantic(metric)
    obj.save()
    return ApiResponse(success=True, message="Updated successfully", data=obj.to_pydantic())


@router.delete("/metric/")
async def delete_metric(
    database: Annotated[SqliteDatabase, Depends(get_database_fastapi)],
    authorization: Annotated[str, Depends(check_authorization)],
    id: Annotated[int, Query(title="Metric ID to delete")] = None,
) -> ApiResponse:
    """Delete a metric by id."""
    if id is None:
        raise HTTPException(status_code=400, detail="Metric ID is required")
    existing = MetricDB.get_or_none(MetricDB.id == id)
    if not existing:
        raise HTTPException(status_code=404, detail=f"Metric with id={id} not found")
    deleted_data = existing.to_pydantic()
    existing.delete_instance()
    return ApiResponse(success=True, message="Deleted successfully", data=deleted_data)


# ============================================================================
# Statistic CRUD
# ============================================================================


@router.get("/statistic/")
async def list_statistics(
    database: Annotated[SqliteDatabase, Depends(get_database_fastapi)],
    authorization: Annotated[str, Depends(check_authorization)],
    page_number: Annotated[int, Query(ge=0)] = 1,
    items_per_page: Annotated[int, Query(ge=1, le=1000)] = 100,
    order_by: Annotated[str | None, Query(pattern="^-?[a-zA-Z0-9_]+$")] = None,
    filter_field: Annotated[str | None, Query(pattern="^[a-zA-Z0-9_]+$")] = None,
    filter_value: Annotated[str | None, Query()] = None,
    filter_operator: Annotated[str, Query(pattern="^(eq|ne|gt|lt|gte|lte|like|in)$")] = "eq",
) -> ApiResponse:
    """List statistics with optional filtering, pagination, and ordering."""
    data, total = build_list_query(
        StatisticDB, page_number, items_per_page, order_by,
        filter_field, filter_value, filter_operator,
    )
    return ApiResponse(success=True, message=str(total), data=data)


@router.post("/statistic/")
async def create_statistic(
    statistic: Statistic,
    database: Annotated[SqliteDatabase, Depends(get_database_fastapi)],
    authorization: Annotated[str, Depends(check_authorization)],
) -> ApiResponse:
    """Create a new statistic entry. Validates that the referenced domain exists."""
    if not DomainDB.get_or_none(DomainDB.id == statistic.domain_id):
        raise HTTPException(status_code=400, detail=f"Domain with id={statistic.domain_id} not found")
    new_obj = StatisticDB.from_pydantic(statistic)
    new_obj.save(force_insert=True)
    return ApiResponse(success=True, message="Created successfully", data=new_obj.to_pydantic())


@router.put("/statistic/")
async def update_statistic(
    statistic: Statistic,
    database: Annotated[SqliteDatabase, Depends(get_database_fastapi)],
    authorization: Annotated[str, Depends(check_authorization)],
) -> ApiResponse:
    """Update an existing statistic by id."""
    if not statistic.id:
        raise HTTPException(status_code=400, detail="Statistic ID is required for update")
    if not StatisticDB.get_or_none(StatisticDB.id == statistic.id):
        raise HTTPException(status_code=404, detail=f"Statistic with id={statistic.id} not found")
    if not DomainDB.get_or_none(DomainDB.id == statistic.domain_id):
        raise HTTPException(status_code=400, detail=f"Domain with id={statistic.domain_id} not found")
    obj = StatisticDB.from_pydantic(statistic)
    obj.save()
    return ApiResponse(success=True, message="Updated successfully", data=obj.to_pydantic())


@router.delete("/statistic/")
async def delete_statistic(
    database: Annotated[SqliteDatabase, Depends(get_database_fastapi)],
    authorization: Annotated[str, Depends(check_authorization)],
    id: Annotated[int, Query(title="Statistic ID to delete")] = None,
) -> ApiResponse:
    """Delete a statistic by id."""
    if id is None:
        raise HTTPException(status_code=400, detail="Statistic ID is required")
    existing = StatisticDB.get_or_none(StatisticDB.id == id)
    if not existing:
        raise HTTPException(status_code=404, detail=f"Statistic with id={id} not found")
    deleted_data = existing.to_pydantic()
    existing.delete_instance()
    return ApiResponse(success=True, message="Deleted successfully", data=deleted_data)


# ============================================================================
# User CRUD (password hashing handled by User Pydantic model validator)
# ============================================================================


@router.get("/user/")
async def list_users(
    database: Annotated[SqliteDatabase, Depends(get_database_fastapi)],
    authorization: Annotated[str, Depends(check_authorization)],
    page_number: Annotated[int, Query(ge=0)] = 1,
    items_per_page: Annotated[int, Query(ge=1, le=1000)] = 100,
    order_by: Annotated[str | None, Query(pattern="^-?[a-zA-Z0-9_]+$")] = None,
    filter_field: Annotated[str | None, Query(pattern="^[a-zA-Z0-9_]+$")] = None,
    filter_value: Annotated[str | None, Query()] = None,
    filter_operator: Annotated[str, Query(pattern="^(eq|ne|gt|lt|gte|lte|like|in)$")] = "eq",
) -> ApiResponse:
    """List users with optional filtering, pagination, and ordering. Passwords are masked."""
    data, total = build_list_query(
        UserDB, page_number, items_per_page, order_by,
        filter_field, filter_value, filter_operator,
    )
    return ApiResponse(success=True, message=str(total), data=data)


@router.post("/user/")
async def create_user(
    user: User,
    database: Annotated[SqliteDatabase, Depends(get_database_fastapi)],
    authorization: Annotated[str, Depends(check_authorization)],
) -> ApiResponse:
    """Create a new user. Plain-text passwords are automatically hashed by the User model."""
    if not user.password or user.password == "********":
        raise HTTPException(status_code=400, detail="A valid password is required to create a user")
    new_obj = UserDB.from_pydantic(user)
    new_obj.save(force_insert=True)
    return ApiResponse(success=True, message="Created successfully", data=new_obj.to_pydantic())


@router.put("/user/")
async def update_user(
    user: User,
    database: Annotated[SqliteDatabase, Depends(get_database_fastapi)],
    authorization: Annotated[str, Depends(check_authorization)],
) -> ApiResponse:
    """Update an existing user by id. Password is re-hashed if changed."""
    if not user.id:
        raise HTTPException(status_code=400, detail="User ID is required for update")
    existing = UserDB.get_or_none(UserDB.id == user.id)
    if not existing:
        raise HTTPException(status_code=404, detail=f"User with id={user.id} not found")

    # If password is the masked placeholder, keep the existing hash
    if not user.password or user.password == "********":
        user.password = existing.password

    obj = UserDB.from_pydantic(user)
    obj.save()
    return ApiResponse(success=True, message="Updated successfully", data=obj.to_pydantic())


@router.delete("/user/")
async def delete_user(
    database: Annotated[SqliteDatabase, Depends(get_database_fastapi)],
    authorization: Annotated[str, Depends(check_authorization)],
    id: Annotated[int, Query(title="User ID to delete")] = None,
) -> ApiResponse:
    """Delete a user by id."""
    if id is None:
        raise HTTPException(status_code=400, detail="User ID is required")
    existing = UserDB.get_or_none(UserDB.id == id)
    if not existing:
        raise HTTPException(status_code=404, detail=f"User with id={id} not found")
    deleted_data = existing.to_pydantic()
    existing.delete_instance()
    return ApiResponse(success=True, message="Deleted successfully", data=deleted_data)
