"""
Basic pytest tests for analytics module.
Run from project root: pytest tests/test_analytics.py -v
"""
import pytest
import sys
from pathlib import Path

# Ensure project root is on path so analytics can find space_missions.csv
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

import analytics


class TestGetMissionCountByCompany:
    def test_known_company(self):
        assert analytics.getMissionCountByCompany("NASA") >= 1

    def test_unknown_company(self):
        assert analytics.getMissionCountByCompany("UnknownCompanyXYZ") == 0

    def test_edge_empty_string(self):
        assert analytics.getMissionCountByCompany("") == 0

    def test_edge_none(self):
        assert analytics.getMissionCountByCompany(None) == 0


class TestGetSuccessRate:
    def test_valid_company(self):
        rate = analytics.getSuccessRate("NASA")
        assert isinstance(rate, float)
        assert 0 <= rate <= 100
        assert len(str(rate).split(".")[-1]) <= 2  # at most 2 decimals

    def test_unknown_company_returns_zero(self):
        assert analytics.getSuccessRate("NonExistentCorp") == 0.0

    def test_edge_empty_string(self):
        assert analytics.getSuccessRate("") == 0.0


class TestGetMissionsByDateRange:
    def test_valid_range(self):
        result = analytics.getMissionsByDateRange("1960-01-01", "1975-12-31")
        assert isinstance(result, list)
        assert all(isinstance(m, str) for m in result)

    def test_invalid_date_format(self):
        assert analytics.getMissionsByDateRange("01-01-1970", "1975-12-31") == []

    def test_empty_range(self):
        result = analytics.getMissionsByDateRange("1900-01-01", "1900-12-31")
        assert result == []

    def test_deterministic_order(self):
        result = analytics.getMissionsByDateRange("2010-01-01", "2025-12-31")
        # Same call should return same order
        result2 = analytics.getMissionsByDateRange("2010-01-01", "2025-12-31")
        assert result == result2


class TestGetTopCompaniesByMissionCount:
    def test_positive_n(self):
        result = analytics.getTopCompaniesByMissionCount(5)
        assert isinstance(result, list)
        assert len(result) <= 5
        for item in result:
            assert isinstance(item, tuple)
            assert len(item) == 2
            assert isinstance(item[0], str)
            assert isinstance(item[1], int)

    def test_edge_n_zero(self):
        assert analytics.getTopCompaniesByMissionCount(0) == []

    def test_edge_n_negative(self):
        assert analytics.getTopCompaniesByMissionCount(-1) == []


class TestGetMissionStatusCount:
    def test_required_keys(self):
        result = analytics.getMissionStatusCount()
        required = ["Success", "Failure", "Partial Failure", "Prelaunch Failure"]
        for k in required:
            assert k in result
        assert len(result) == 4

    def test_values_non_negative(self):
        result = analytics.getMissionStatusCount()
        for v in result.values():
            assert isinstance(v, int)
            assert v >= 0


class TestGetMissionsByYear:
    def test_valid_year(self):
        count = analytics.getMissionsByYear(2020)
        assert isinstance(count, int)
        assert count >= 0

    def test_edge_out_of_range(self):
        assert analytics.getMissionsByYear(1800) == 0
        assert analytics.getMissionsByYear(2200) == 0


class TestGetMostUsedRocket:
    def test_returns_string(self):
        result = analytics.getMostUsedRocket()
        assert isinstance(result, str)


class TestGetAverageMissionsPerYear:
    def test_valid_range(self):
        result = analytics.getAverageMissionsPerYear(2000, 2020)
        assert isinstance(result, float)
        assert result >= 0
        assert len(str(result).split(".")[-1]) <= 2

    def test_edge_inverted_range(self):
        assert analytics.getAverageMissionsPerYear(2020, 2000) == 0.0

    def test_single_year(self):
        result = analytics.getAverageMissionsPerYear(2020, 2020)
        assert isinstance(result, float)
        assert result >= 0


class TestSetActiveDfGetActiveDf:
    """Tests for optional helper functions (do not affect graded functions)."""

    def test_set_and_get_active_df(self):
        import pandas as pd
        df = pd.DataFrame({"A": [1, 2], "B": [3, 4]})
        analytics.set_active_df(df)
        result = analytics.get_active_df()
        assert result is not None
        assert len(result) == 2
        assert list(result.columns) == ["A", "B"]
        analytics.set_active_df(None)

    def test_get_active_df_returns_none_when_cleared(self):
        analytics.set_active_df(None)
        assert analytics.get_active_df() is None

    def test_set_none_clears_active_df(self):
        import pandas as pd
        analytics.set_active_df(pd.DataFrame({"x": [1]}))
        analytics.set_active_df(None)
        assert analytics.get_active_df() is None
