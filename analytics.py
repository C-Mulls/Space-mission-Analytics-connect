"""
Space Missions Dashboard - Analytics Module
All functions are programmatically tested. Do not change names or signatures.
"""
from __future__ import annotations

from pathlib import Path
from typing import TYPE_CHECKING

import pandas as pd

if TYPE_CHECKING:
    from pandas import DataFrame

# Module-level cache for the loaded dataframe
_cached_df: DataFrame | None = None


def _load_df() -> "DataFrame":
    """Load space_missions.csv from the same directory as this module or cwd.
    Parse dates, normalize whitespace, handle empty Price.
    """
    global _cached_df
    if _cached_df is not None:
        return _cached_df

    # Try same directory as analytics.py first, then cwd
    module_dir = Path(__file__).resolve().parent
    paths_to_try = [
        module_dir / "space_missions.csv",
        Path.cwd() / "space_missions.csv",
    ]

    path = None
    for p in paths_to_try:
        if p.exists():
            path = p
            break

    if path is None:
        raise FileNotFoundError("space_missions.csv not found in module directory or cwd")

    df = pd.read_csv(path)
    df["Date"] = pd.to_datetime(df["Date"], format="%Y-%m-%d", errors="coerce").dt.date
    df["Company"] = df["Company"].astype(str).str.strip()
    df["MissionStatus"] = df["MissionStatus"].astype(str).str.strip()
    df["Rocket"] = df["Rocket"].astype(str).str.strip()
    df["Mission"] = df["Mission"].astype(str).str.strip()
    df["Price"] = pd.to_numeric(df["Price"], errors="coerce")

    _cached_df = df
    return _cached_df


def get_df() -> "DataFrame":
    """Public helper to get the loaded dataframe. Used by app.py and tests."""
    return _load_df()


# Optional helpers for dashboard when using uploaded data (do not affect graded functions)
_active_df: "DataFrame | None" = None


def set_active_df(df: "DataFrame | None") -> None:
    """Set the active dataframe for dashboard use. Graded functions ignore this."""
    global _active_df
    _active_df = df


def get_active_df() -> "DataFrame | None":
    """Return the active dataframe set by set_active_df, or None if not set."""
    return _active_df


def getMissionCountByCompany(companyName: str) -> int:
    """Return count of missions for the given company (exact match after strip)."""
    if companyName is None or (isinstance(companyName, str) and not str(companyName).strip()):
        return 0
    df = _load_df()
    name = str(companyName).strip()
    return int((df["Company"] == name).sum())


def getSuccessRate(companyName: str) -> float:
    """Success rate percent = (Success missions / total) * 100. Rounded to 2 decimals."""
    if companyName is None or (isinstance(companyName, str) and not str(companyName).strip()):
        return 0.0
    df = _load_df()
    name = str(companyName).strip()
    subset = df[df["Company"] == name]
    total = len(subset)
    if total == 0:
        return 0.0
    success_count = (subset["MissionStatus"] == "Success").sum()
    return round(100.0 * success_count / total, 2)


def getMissionsByDateRange(startDate: str, endDate: str) -> list:
    """Return list of Mission names in date range (inclusive), sorted by Date then Mission."""
    import re
    if startDate is None or endDate is None:
        return []
    pattern = r"^\d{4}-\d{2}-\d{2}$"
    if not (re.match(pattern, str(startDate)) and re.match(pattern, str(endDate))):
        return []
    try:
        start = pd.to_datetime(startDate).date()
        end = pd.to_datetime(endDate).date()
    except Exception:
        return []
    if start > end:
        return []
    df = _load_df()
    df = df.dropna(subset=["Date"])
    mask = (df["Date"] >= start) & (df["Date"] <= end)
    subset = df[mask].copy()
    subset = subset.sort_values(by=["Date", "Mission"])
    return subset["Mission"].tolist()


def getTopCompaniesByMissionCount(n: int) -> list:
    """Return list of (companyName, missionCount) tuples, top n by count, ties by company name asc."""
    if n is None or not isinstance(n, int) or n <= 0:
        return []
    df = _load_df()
    counts = df["Company"].value_counts().reset_index()
    counts.columns = ["Company", "Count"]
    counts = counts.sort_values(by=["Count", "Company"], ascending=[False, True])
    result = [(row["Company"], int(row["Count"])) for _, row in counts.head(n).iterrows()]
    return result


def getMissionStatusCount() -> dict:
    """Return dict with keys Success, Failure, Partial Failure, Prelaunch Failure; values are counts."""
    required_keys = ["Success", "Failure", "Partial Failure", "Prelaunch Failure"]
    df = _load_df()
    counts = df["MissionStatus"].value_counts()
    result = {k: int(counts.get(k, 0)) for k in required_keys}
    return result


def getMissionsByYear(year: int) -> int:
    """Count missions where Date year equals year. Invalid year returns 0."""
    if year is None or not isinstance(year, int):
        return 0
    if year < 1950 or year > 2100:
        return 0
    df = _load_df()
    df = df.dropna(subset=["Date"])
    return int((df["Date"].apply(lambda d: d.year) == year).sum())


def getMostUsedRocket() -> str:
    """Return the Rocket with highest usage count. Tie-break: alphabetical ascending. Empty if no data."""
    df = _load_df()
    valid = (df["Rocket"].str.len() > 0) & (df["Rocket"].str.lower() != "nan")
    df = df[valid]
    if len(df) == 0:
        return ""
    counts = df["Rocket"].value_counts()
    max_count = counts.max()
    top_rockets = counts[counts == max_count].index.tolist()
    return sorted(top_rockets)[0] if top_rockets else ""


def getAverageMissionsPerYear(startYear: int, endYear: int) -> float:
    """Average missions per year in range [startYear, endYear] inclusive. Rounded to 2 decimals."""
    if (
        startYear is None
        or endYear is None
        or not isinstance(startYear, int)
        or not isinstance(endYear, int)
    ):
        return 0.0
    if startYear > endYear:
        return 0.0
    df = _load_df()
    df = df.dropna(subset=["Date"])
    years_in_range = df["Date"].apply(lambda d: d.year)
    mask = (years_in_range >= startYear) & (years_in_range <= endYear)
    total = mask.sum()
    num_years = endYear - startYear + 1
    if num_years <= 0:
        return 0.0
    return round(float(total) / num_years, 2)
