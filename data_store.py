"""
Space Missions Dashboard - Data Store
Manages the active dataframe in Streamlit session state.
"""
import streamlit as st
import pandas as pd
from typing import Optional

REQUIRED_COLUMNS = [
    "Company",
    "Location",
    "Date",
    "Time",
    "Rocket",
    "Mission",
    "RocketStatus",
    "Price",
    "MissionStatus",
]


def init_session_state() -> None:
    """Initialize session state keys if not present."""
    if "df_active" not in st.session_state:
        st.session_state["df_active"] = None
    if "file_name" not in st.session_state:
        st.session_state["file_name"] = None
    if "load_errors" not in st.session_state:
        st.session_state["load_errors"] = []


def set_df(df: pd.DataFrame, file_name: str) -> None:
    """Store cleaned dataframe and filename. Clear load errors."""
    st.session_state["df_active"] = df
    st.session_state["file_name"] = file_name
    st.session_state["load_errors"] = []


def clear_df() -> None:
    """Reset df_active, file_name, and load_errors."""
    st.session_state["df_active"] = None
    st.session_state["file_name"] = None
    st.session_state["load_errors"] = []


def get_df() -> Optional[pd.DataFrame]:
    """Return the active dataframe or None."""
    return st.session_state.get("df_active")


def get_file_name() -> Optional[str]:
    """Return the uploaded filename or None."""
    return st.session_state.get("file_name")


def set_load_errors(errors: list) -> None:
    """Store validation/load errors."""
    st.session_state["load_errors"] = list(errors)


def get_load_errors() -> list:
    """Return current load errors."""
    return st.session_state.get("load_errors", [])
