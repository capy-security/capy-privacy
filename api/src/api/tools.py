from api.logging import config_logger
from fastapi import Request, HTTPException
import asyncio
import json
import os
import re


def is_list_of(data, type):
    return isinstance(data, list) and all(isinstance(elem, type) for elem in data)


def multiple_replace(dict, text):
    # Create a regular expression  from the dictionary keys
    regex = re.compile("(%s)" % "|".join(map(re.escape, dict.keys())))
    # For each match, look-up corresponding value in dictionary
    return regex.sub(
        lambda mo: dict[mo.string[mo.start() : mo.end()]],  # noqa: E203
        text,
    )


async def run_shell(cmd: str):
    process = await asyncio.create_subprocess_shell(
        cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
    )
    stdout, stderr = await process.communicate()
    return stdout.decode("utf-8").strip(), stderr.decode("utf-8").strip()


async def run_shell_live(cmd: str):
    LOGGER = config_logger(__name__)
    process = await asyncio.create_subprocess_shell(
        cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
    )
    LOGGER.info("--- command execution started ---")
    i = 0
    stdout_line = await process.stdout.readline()
    stderr_line = await process.stderr.readline()
    while len(stdout_line) > 0 or len(stderr_line) > 0 and i < 100:
        LOGGER.info(f"{len(stdout_line)}/{len(stderr_line)}")
        if stdout_line:
            LOGGER.info(stdout_line.decode("utf-8").strip())
        if stderr_line:
            LOGGER.error(stderr_line.decode("utf-8").strip())
        stdout_line = await process.stdout.readline()
        stderr_line = await process.stderr.readline()
        i += 1
    LOGGER.info("--- command execution finished ---")
    return process.returncode


async def tail_f(filename: str):
    """generator function that yields new lines in a file"""
    with open(filename, "r") as logfile:
        # seek the end of the file
        logfile.seek(0, os.SEEK_END)

        # start infinite loop
        while True:
            # read last line of file
            line = logfile.readline()
            # sleep if file hasn't been updated
            if not line:
                await asyncio.sleep(1)
                continue

            yield line


async def read_file(filename: str):
    conf = ""
    try:
        with open(filename, "r") as file:
            conf = file.read()
    except EnvironmentError:
        return {"error": "file not found"}

    return {"config": conf}


def read_last_lines(filename: str, num_lines: int, as_json=False):
    try:
        with open(filename, "rb") as f:
            last_lines = []
            try:  # catch OSError in case of a one line file
                f.seek(-2, os.SEEK_END)

                for i in range(num_lines):
                    while f.read(1) != b"\n":
                        f.seek(-2, os.SEEK_CUR)
                    # read the log line
                    line = f.readline()
                    line_size = len(line)
                    line_clean = line.strip()
                    line_text = line_clean.decode(encoding="utf-8")

                    # Load lines as Python Dict (from JSON)
                    if as_json:
                        try:
                            line_json = json.loads(line_text)
                        except ValueError as e:
                            # In case the line is not in JSON format
                            line_json = {"message": e}

                        last_lines.append(line_json)
                    else:

                        last_lines.append(line_text)

                    # jump to previous line (offset+2)
                    f.seek(-(line_size + 2), os.SEEK_CUR)

            except OSError:
                f.seek(0)
                f.close()

    # file errors
    except EnvironmentError:
        if as_json:
            return [{"error": "file not found"}]
        else:
            return ["file not found"]

    return last_lines


def check_content_type(content_type_required, request: Request):
    content_type = request.headers.get("content-type", None)
    if content_type != content_type_required:
        raise HTTPException(status_code=415, detail="Unsupported media type")


def nested_get(input_dict, nested_keys):
    """This function gets nested values within dictionnaries
    returns null if value not found
    """
    internal_dict_value = input_dict
    for key in nested_keys:
        internal_dict_value = internal_dict_value.get(key, None)
        if internal_dict_value is None:
            return None
    return internal_dict_value


def get_nested_value(dictionary, keys, default=None):
    try:
        for key in keys:
            if isinstance(dictionary, list):
                dictionary = dictionary[key]
            elif isinstance(dictionary, dict):
                dictionary = dictionary.get(key)
        return (
            dictionary
            if isinstance(dictionary, (dict, list, int, str, float))
            else default
        )
    except (IndexError, TypeError, AttributeError):
        return default


def get_nested_values(dictionary, keys):
    if len(keys) > 0:
        key = keys[0]
        element = dictionary.get(key)
        if len(keys) == 1:
            yield element
        else:
            if isinstance(element, dict):
                yield from get_nested_values(element, keys[1:])
            elif isinstance(element, list):
                for e in element:
                    yield from get_nested_values(e, keys[1:])
