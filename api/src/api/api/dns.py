from fastapi import APIRouter, Path, Query, Depends, HTTPException
from pydantic import BaseModel
from typing import Annotated, Dict, Any
from api.database import tables, Tables, get_database_fastapi
from api.load import load_ads_domains
from api.models.api import ApiResponse
from api.models.group import AssociationCategories, AssociationClients
from api.models.category import CategoryDB
from api.models.client import ClientDB
from api.security import check_authorization
from peewee import Model, SqliteDatabase, ModelSelect, BooleanField, IntegerField
import logging


logger = logging.getLogger(__name__)

MAX_PER_PAGE = 100


router = APIRouter(
    prefix="/dns",
    tags=["dns"],
    responses={404: {"description": "Not found"}},
)


class Values(BaseModel):
    values_to_update: dict


class Filter(BaseModel):
    filter: dict


def convert_filter_value(field, value: str):
    """
    Convert a string filter value to the appropriate type based on the field type.

    Args:
        field: The Peewee field object
        value: The string value to convert

    Returns:
        The converted value with the appropriate type
    """
    # Handle boolean fields
    if isinstance(field, BooleanField):
        value_lower = value.lower().strip()
        if value_lower in ("1", "true", "yes", "on"):
            return True
        elif value_lower in ("0", "false", "no", "off"):
            return False
        else:
            # Try to convert to bool if it's already a boolean-like value
            try:
                return bool(int(value))
            except (ValueError, TypeError):
                raise ValueError(f"Cannot convert '{value}' to boolean")

    # Handle integer fields
    elif isinstance(field, IntegerField):
        try:
            return int(value)
        except (ValueError, TypeError):
            raise ValueError(f"Cannot convert '{value}' to integer")

    # For other field types (CharField, etc.), return as string
    return value


@router.get("/ads/")
async def update_ads(
    database: Annotated[SqliteDatabase, Depends(get_database_fastapi)],
    authorization: Annotated[str, Depends(check_authorization)],
) -> ApiResponse:
    """Update the DNS records"""
    response = ApiResponse(success=False, message="", data={})

    success, total_inserted, total_attempted = await load_ads_domains()
    if success:
        response.success = True
        response.message = f"Successfully inserted {total_inserted} domains"
        response.data = {"inserted": total_inserted, "attempted": total_attempted}
    else:
        response.message = (
            f"Failed to insert domains: {total_inserted}/{total_attempted}"
        )
        response.data = {"inserted": total_inserted, "attempted": total_attempted}

    return response


@router.get("/{table}/")
async def read_object(
    table: Annotated[Tables, Path(title="DB table name")],
    database: Annotated[SqliteDatabase, Depends(get_database_fastapi)],
    authorization: Annotated[str, Depends(check_authorization)],
    page_number: Annotated[int, Query(title="page element", ge=0)] = 1,
    items_per_page: Annotated[int, Query(title="Max per page", ge=1, te=1000)] = 100,
    order_by: Annotated[
        str,
        Query(
            title="Order by",
            pattern="^[a-zA-Z0-9_-]+$",
        ),
    ] = None,
    # Filter parameters
    filter_field: Annotated[
        str, Query(title="Field to filter on", pattern="^[a-zA-Z0-9_-]+$")
    ] = None,
    filter_value: Annotated[str, Query(title="Value to filter by")] = None,
    filter_operator: Annotated[
        str, Query(title="Filter operator", pattern="^(eq|ne|gt|lt|gte|lte|like|in)$")
    ] = "eq",
) -> ApiResponse:
    """Read objects from the specified table with optional filtering, pagination, and ordering"""
    response = ApiResponse(success=False, message="", data={})

    model_class: Model = tables.get(table.value)
    if not model_class:
        raise HTTPException(status_code=404, detail=f"Table {table.value} not found")

    # Build base query with optional filters
    base_query = model_class.select()

    # Apply filters if provided
    if filter_field and filter_value:
        if not hasattr(model_class, filter_field):
            response.message = (
                f"Field '{filter_field}' does not exist in table '{table.value}'"
            )
            response.data = {"error": "Field not found"}
            return response

        field = getattr(model_class, filter_field)

        # Convert filter value to appropriate type
        try:
            converted_value = convert_filter_value(field, filter_value)
        except ValueError as e:
            response.message = str(e)
            response.data = {"error": "Invalid filter value type"}
            return response

        if filter_operator == "eq":
            logger.info(
                f"Filtering by {field} == {converted_value} (original: {filter_value})"
            )
            base_query = base_query.where(field == converted_value)
        elif filter_operator == "ne":
            base_query = base_query.where(field != converted_value)
        elif filter_operator == "gt":
            base_query = base_query.where(field > converted_value)
        elif filter_operator == "lt":
            base_query = base_query.where(field < converted_value)
        elif filter_operator == "gte":
            base_query = base_query.where(field >= converted_value)
        elif filter_operator == "lte":
            base_query = base_query.where(field <= converted_value)
        elif filter_operator == "like":
            base_query = base_query.where(field.contains(converted_value))
        elif filter_operator == "in":
            # Expect comma-separated values for 'in' operator
            # Convert each value individually
            values = []
            for v in filter_value.split(","):
                try:
                    converted_v = convert_filter_value(field, v.strip())
                    values.append(converted_v)
                except ValueError as e:
                    response.message = (
                        f"Invalid value in 'in' operator: {v.strip()} - {str(e)}"
                    )
                    response.data = {"error": "Invalid filter value type"}
                    return response
            base_query = base_query.where(field.in_(values))
        else:
            response.message = f"Invalid filter operator: {filter_operator}"
            response.data = {"error": "Invalid filter operator"}
            return response

    # Count total with filters applied
    total = base_query.count()

    if page_number == 0:
        # Calculate the last page number correctly
        if total == 0:
            page_number = 1  # Default to page 1 if no items
        else:
            page_number = (total - 1) // items_per_page + 1

    query: ModelSelect = base_query

    # Apply ordering
    if order_by:
        order_field = order_by
        desc_order = False

        if order_by.startswith("-"):
            order_field = order_by[1:]
            desc_order = True

        if not hasattr(model_class, order_field):
            raise HTTPException(
                status_code=400,
                detail=f"Order field '{order_field}' does not exist in table '{table.value}'",
            )

        field_attr = getattr(model_class, order_field)
        if desc_order:
            query = query.order_by(field_attr.desc())
        else:
            query = query.order_by(field_attr)
    else:
        # Default ordering by id
        query = query.order_by(model_class.id)

    # Apply pagination
    if page_number and items_per_page:
        logger.debug("Applying pagination")
        query = query.paginate(page_number, items_per_page)

    # Execute query and build response
    data = []
    for obj in query:
        logger.debug(f"Processing object: {obj}")
        data.append(obj.to_pydantic())

    response.success = True
    response.message = str(total)
    response.data = data

    return response


@router.post("/{table}/")
async def create_object(
    table: Annotated[Tables, Path(title="DB table name")],
    data: Dict[str, Any],
    database: Annotated[SqliteDatabase, Depends(get_database_fastapi)],
    authorization: Annotated[str, Depends(check_authorization)],
) -> ApiResponse:
    """Create a new row in the specified table"""
    response = ApiResponse(success=False, message="", data={})
    model_class: Model = tables.get(table.value)
    if not model_class:
        raise HTTPException(status_code=404, detail=f"Table {table.value} not found")

    # Special handling for Group table which has many-to-many relationships
    if table.value == "group":
        # Extract association IDs (support both singular and plural field names)
        category_ids = data.get("category_ids") or data.get("categories_ids") or []
        client_ids = data.get("client_ids") or data.get("clients_ids") or []

        # Create new instance from the provided data
        # Remove 'id' and association fields from data
        create_data = {
            k: v
            for k, v in data.items()
            if k
            not in ["id", "category_ids", "categories_ids", "client_ids", "clients_ids"]
        }

        # Create the group
        new_obj = model_class.create(**create_data)

        # Create association records for categories
        for category_id in category_ids:
            try:
                category = CategoryDB.get(CategoryDB.id == category_id)
                AssociationCategories.create(group=new_obj, category=category)
            except CategoryDB.DoesNotExist:
                logger.warning(f"Category with id {category_id} not found, skipping")
            except Exception as e:
                logger.error(f"Error creating category association: {e}")

        # Create association records for clients
        for client_id in client_ids:
            try:
                client = ClientDB.get(ClientDB.id == client_id)
                AssociationClients.create(group=new_obj, client=client)
            except ClientDB.DoesNotExist:
                logger.warning(f"Client with id {client_id} not found, skipping")
            except Exception as e:
                logger.error(f"Error creating client association: {e}")

    else:
        # Create new instance from the provided data
        # Remove 'id' from data if present since it's auto-generated
        create_data = {k: v for k, v in data.items() if k != "id"}

        # Create the new object
        new_obj = model_class.create(**create_data)

    # Return the created object
    response.success = True
    response.message = "Created successfully"
    response.data = new_obj.to_pydantic()

    return response


@router.put("/{table}/")
async def update_object(
    table: Annotated[Tables, Path(title="DB table name")],
    data: Dict[str, Any],
    database: Annotated[SqliteDatabase, Depends(get_database_fastapi)],
    authorization: Annotated[str, Depends(check_authorization)],
    key_field: Annotated[
        str, Query(title="Field to use as key for update", pattern="^[a-zA-Z0-9_-]+$")
    ] = "id",
) -> ApiResponse:
    """Update an existing row in the specified table"""
    response = ApiResponse(success=False, message="", data={})

    model_class: Model = tables.get(table.value)
    if not model_class:
        raise HTTPException(status_code=404, detail=f"Table {table.value} not found")

    if key_field in data:
        key_attr = getattr(model_class, key_field)
        key_value = data[key_field]
    else:
        raise HTTPException(
            status_code=400,
            detail=f"No key value '{key_field}' provided in data",
        )

    # Validate that the key field exists in the model
    if not hasattr(model_class, key_field):
        raise HTTPException(
            status_code=400,
            detail=f"Key field '{key_field}' does not exist in table '{table.value}'",
        )

    # Find the existing object

    logger.debug(f"Key attribute: {key_attr}")
    logger.debug(f"Key value: {key_value}")
    model_class.get(key_attr == key_value)

    # Special handling for Group table which has many-to-many relationships
    if table.value == "group":
        # Extract association IDs (support both singular and plural field names)
        category_ids = data.get("category_ids") or data.get("categories_ids")
        client_ids = data.get("client_ids") or data.get("clients_ids")

        # Prepare update data (exclude the key field and association fields from updates)
        update_data = {
            k: v
            for k, v in data.items()
            if k
            not in [
                key_field,
                "category_ids",
                "categories_ids",
                "client_ids",
                "clients_ids",
            ]
        }

        # Validate that all fields exist in the model (excluding association fields)
        for field_name in update_data.keys():
            if not hasattr(model_class, field_name):
                raise HTTPException(
                    status_code=400,
                    detail=f"Field '{field_name}' does not exist in table '{table.value}'",
                )

        # Update the group object if there are fields to update
        if update_data:
            query = model_class.update(**update_data).where(key_attr == key_value)
            rows_updated = query.execute()
            logger.info(f"Rows updated: {rows_updated}")

            if rows_updated == 0:
                raise HTTPException(
                    status_code=404,
                    detail=f"No rows were updated. Object with {key_field}={key_value} may not exist",
                )
        else:
            # If only associations are being updated, verify the group exists
            try:
                model_class.get(key_attr == key_value)
            except model_class.DoesNotExist:
                raise HTTPException(
                    status_code=404,
                    detail=f"Object with {key_field}={key_value} not found",
                )

        # Get the group object
        group_obj = model_class.get(key_attr == key_value)

        # Update associations if provided
        if category_ids is not None:
            # Delete existing category associations
            AssociationCategories.delete().where(
                AssociationCategories.group == group_obj
            ).execute()

            # Create new category associations
            for category_id in category_ids:
                try:
                    category = CategoryDB.get(CategoryDB.id == category_id)
                    AssociationCategories.create(group=group_obj, category=category)
                except CategoryDB.DoesNotExist:
                    logger.warning(
                        f"Category with id {category_id} not found, skipping"
                    )
                except Exception as e:
                    logger.error(f"Error updating category association: {e}")

        if client_ids is not None:
            # Delete existing client associations
            AssociationClients.delete().where(
                AssociationClients.group == group_obj
            ).execute()

            # Create new client associations
            for client_id in client_ids:
                try:
                    client = ClientDB.get(ClientDB.id == client_id)
                    AssociationClients.create(group=group_obj, client=client)
                except ClientDB.DoesNotExist:
                    logger.warning(f"Client with id {client_id} not found, skipping")
                except Exception as e:
                    logger.error(f"Error updating client association: {e}")

        # Fetch and return the updated object
        updated_obj = model_class.get(key_attr == key_value)
        response.success = True
        response.message = "Updated successfully"
        response.data = updated_obj.to_pydantic()

        return response

    # Standard update for other tables
    # Prepare update data (exclude the key field from updates to avoid conflicts)
    update_data = {k: v for k, v in data.items() if k != key_field}

    if not update_data:
        raise HTTPException(
            status_code=400,
            detail="No fields to update provided",
        )

    # Validate that all fields exist in the model
    for field_name in update_data.keys():
        if not hasattr(model_class, field_name):
            raise HTTPException(
                status_code=400,
                detail=f"Field '{field_name}' does not exist in table '{table.value}'",
            )

    # Update the object
    query = model_class.update(**update_data).where(key_attr == key_value)
    rows_updated = query.execute()
    logger.info(f"Rows updated: {rows_updated}")

    if rows_updated == 0:
        raise HTTPException(
            status_code=404,
            detail=f"No rows were updated. Object with {key_field}={key_value} may not exist",
        )

    # Fetch and return the updated object
    updated_obj = model_class.get(key_attr == key_value)
    response.success = True
    response.message = f"Updated successfully ({rows_updated} row(s))"
    response.data = updated_obj.to_pydantic()

    return response


@router.delete("/{table}/")
async def delete_object(
    table: Annotated[Tables, Path(title="DB table name")],
    database: Annotated[SqliteDatabase, Depends(get_database_fastapi)],
    authorization: Annotated[str, Depends(check_authorization)],
    key_field: Annotated[
        str, Query(title="Field to use as key for deletion", pattern="^[a-zA-Z0-9_-]+$")
    ] = "id",
    key_value: Annotated[
        str, Query(title="Value of the key field for deletion")
    ] = None,
) -> ApiResponse:
    """Delete an existing row from the specified table"""
    response = ApiResponse(success=False, message="", data={})

    model_class: Model = tables.get(table.value)
    if not model_class:
        raise HTTPException(status_code=404, detail=f"Table {table.value} not found")

    if key_value is not None:
        delete_key_field = key_field
        delete_key_value = key_value
    else:
        raise HTTPException(
            status_code=400,
            detail="No key value provided. Either use 'id' query parameter or provide 'key_field' and 'key_value'",
        )

    # Validate that the key field exists in the model
    if not hasattr(model_class, delete_key_field):
        raise HTTPException(
            status_code=400,
            detail=f"Key field '{delete_key_field}' does not exist in table '{table.value}'",
        )

    # Find the existing object first (to return it in response and verify it exists)
    key_attr = getattr(model_class, delete_key_field)

    existing_obj = model_class.get(key_attr == delete_key_value)
    # Store the object data before deletion
    deleted_data = existing_obj.to_pydantic()

    # Special handling for Group table: delete associations first
    if table.value == "group":
        # Delete category associations
        AssociationCategories.delete().where(
            AssociationCategories.group == existing_obj
        ).execute()
        # Delete client associations
        AssociationClients.delete().where(
            AssociationClients.group == existing_obj
        ).execute()

    # Delete the object
    rows_deleted = model_class.delete().where(key_attr == delete_key_value).execute()

    if rows_deleted == 0:
        raise HTTPException(
            status_code=404,
            detail=f"No rows were deleted for {delete_key_field}={delete_key_value}",
        )

    response.success = True
    response.message = f"Deleted successfully ({rows_deleted} row(s))"
    response.data = deleted_data

    return response
