"""
Space Missions Dashboard - Streamlit App
Works with user-uploaded CSV files. No sample or hardcoded data.
"""
from pathlib import Path
import io

import streamlit as st
import pandas as pd
import plotly.express as px

import analytics
import data_store

# Page config
st.set_page_config(
    page_title="Space Missions Dashboard",
    page_icon="🚀",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Initialize session state and restore active df for analytics helper
data_store.init_session_state()
if data_store.get_df() is not None:
    analytics.set_active_df(data_store.get_df())

# --- Header with logo ---
col_logo, col_title = st.columns([1, 8])
with col_logo:
    logo_path = Path(__file__).parent / "assets" / "logo.svg"
    if logo_path.exists():
        st.image(str(logo_path), width=64)
    else:
        st.markdown("**🚀**")
with col_title:
    st.title("Space Missions Dashboard")

st.markdown("---")

# --- Upload CSV section ---
st.subheader("Upload CSV")

uploaded_file = st.file_uploader(
    "Upload a CSV",
    type=["csv"],
    accept_multiple_files=False,
    help="Drag and drop a file here, or click to browse.",
    key="csv_upload",
)

if uploaded_file is not None:
    try:
        raw_df = pd.read_csv(uploaded_file)
        raw_cols = set(raw_df.columns)
        required = set(data_store.REQUIRED_COLUMNS)
        missing = required - raw_cols
        if missing:
            data_store.clear_df()
            data_store.set_load_errors([f"Missing required columns: {', '.join(sorted(missing))}"])
            analytics.set_active_df(None)
        else:
            data_store.set_load_errors([])
            df = raw_df.copy()
            # Parse Date
            df["Date"] = pd.to_datetime(df["Date"], errors="coerce")
            before = len(df)
            df = df.dropna(subset=["Date"])
            dropped = before - len(df)
            if dropped > 0:
                st.warning(f"Dropped {dropped} row(s) with invalid or missing dates.")
            # Strip whitespace
            for col in ["Company", "MissionStatus", "Rocket", "Mission", "Location", "RocketStatus"]:
                if col in df.columns:
                    df[col] = df[col].astype(str).str.strip()
            df["Price"] = pd.to_numeric(df["Price"], errors="coerce")
            data_store.set_df(df, uploaded_file.name)
            analytics.set_active_df(df)
    except Exception as e:
        data_store.clear_df()
        data_store.set_load_errors([str(e)])
        analytics.set_active_df(None)

# Show load errors
for err in data_store.get_load_errors():
    st.error(err)

# Clear dataset button (only when we have data)
if data_store.get_df() is not None:
    if st.button("Clear dataset"):
        data_store.clear_df()
        analytics.set_active_df(None)
        if "csv_upload" in st.session_state:
            del st.session_state["csv_upload"]
        st.rerun()

st.markdown("---")

# --- Main content: empty state or dashboard ---
df = analytics.get_active_df() if data_store.get_df() is not None else None

if df is None or len(df) == 0:
    st.info("**Upload a CSV to begin**")
    st.markdown("""
    **Required columns:** `Company`, `Location`, `Date`, `Time`, `Rocket`, `Mission`, `RocketStatus`, `Price`, `MissionStatus`  
    **Date format:** `YYYY-MM-DD` (e.g. 2020-07-30). Rows with invalid dates will be dropped.
    """)
    st.stop()

# --- UX: filename and row count ---
file_name = data_store.get_file_name() or "Uploaded file"
st.caption(f"**File:** {file_name} | **Rows:** {len(df):,}")

# Download cleaned CSV button
csv_buffer = io.StringIO()
export_df = df.copy()
if "Date" in export_df.columns and hasattr(export_df["Date"].iloc[0], "strftime"):
    export_df = export_df.copy()
    export_df["Date"] = export_df["Date"].dt.strftime("%Y-%m-%d")
export_df.to_csv(csv_buffer, index=False)
st.download_button(
    "Download cleaned CSV",
    data=csv_buffer.getvalue(),
    file_name="space_missions_cleaned.csv",
    mime="text/csv",
    key="download_csv",
)

st.markdown("---")

# Ensure Date is datetime for filtering
df = df.copy()
if df["Date"].dtype != "datetime64[ns]":
    df["Date"] = pd.to_datetime(df["Date"], errors="coerce")
df = df.dropna(subset=["Date"])

min_date = df["Date"].min().date()
max_date = df["Date"].max().date()

# --- Sidebar filters ---
st.sidebar.header("Filters")

date_start = st.sidebar.date_input(
    "Start date",
    value=min_date,
    min_value=min_date,
    max_value=max_date,
)
date_end = st.sidebar.date_input(
    "End date",
    value=max_date,
    min_value=min_date,
    max_value=max_date,
)

companies = sorted(df["Company"].unique().tolist())
selected_companies = st.sidebar.multiselect(
    "Company",
    options=companies,
    default=[],
)

statuses = sorted(df["MissionStatus"].unique().tolist())
selected_statuses = st.sidebar.multiselect(
    "Mission status",
    options=statuses,
    default=[],
)

mission_search = st.sidebar.text_input(
    "Search Mission (substring)",
    value="",
    placeholder="e.g. Apollo, Dragon",
)

# Apply filters
filtered = df.copy()
filtered = filtered[(filtered["Date"].dt.date >= date_start) & (filtered["Date"].dt.date <= date_end)]
if selected_companies:
    filtered = filtered[filtered["Company"].isin(selected_companies)]
if selected_statuses:
    filtered = filtered[filtered["MissionStatus"].isin(selected_statuses)]
if mission_search and mission_search.strip():
    filtered = filtered[filtered["Mission"].str.contains(mission_search.strip(), case=False, na=False)]

# --- Summary cards ---
total_missions = len(filtered)
success_count = (filtered["MissionStatus"] == "Success").sum()
overall_success_rate = round(100.0 * success_count / total_missions, 2) if total_missions > 0 else 0.0
unique_companies = filtered["Company"].nunique()
rocket_counts = filtered["Rocket"].value_counts()
most_used_filtered = rocket_counts.index[0] if len(rocket_counts) > 0 else "—"

c1, c2, c3, c4 = st.columns(4)
c1.metric("Total missions", total_missions)
c2.metric("Overall success rate (%)", f"{overall_success_rate:.1f}")
c3.metric("Unique companies", unique_companies)
c4.metric("Most used rocket (filtered)", most_used_filtered)

st.markdown("---")

# --- Data table ---
st.subheader("Filtered missions")
display_cols = [c for c in ["Company", "Location", "Date", "Rocket", "Mission", "MissionStatus"] if c in filtered.columns]
if display_cols:
    table_df = filtered[display_cols].copy()
    if "Date" in table_df.columns:
        table_df["Date"] = table_df["Date"].dt.strftime("%Y-%m-%d")
    st.dataframe(table_df, use_container_width=True)

st.markdown("---")
st.subheader("Visualizations")

# --- Chart A: Success rate over time by year ---
st.markdown("**A) Success rate over time by year**")
yearly = filtered.copy()
yearly["Year"] = yearly["Date"].dt.year
yearly_agg = yearly.groupby("Year").agg(
    total=("Mission", "count"),
    success=("MissionStatus", lambda s: (s == "Success").sum()),
).reset_index()
yearly_agg["Success rate (%)"] = (100.0 * yearly_agg["success"] / yearly_agg["total"]).round(2)
fig_a = px.line(
    yearly_agg,
    x="Year",
    y="Success rate (%)",
    markers=True,
)
fig_a.update_layout(
    template="plotly_white",
    xaxis_title="Year",
    yaxis_title="Success rate (%)",
    height=350,
)
st.plotly_chart(fig_a, use_container_width=True)

# --- Chart B: Missions by company (top N) ---
st.markdown("**B) Missions by company**")
top_n_max = min(20, max(3, len(companies)))
top_n = st.slider("Top N companies", min_value=3, max_value=top_n_max, value=min(10, top_n_max), key="top_n")
company_counts = filtered["Company"].value_counts().head(top_n).reset_index()
company_counts.columns = ["Company", "Count"]
company_counts = company_counts.sort_values(by=["Count", "Company"], ascending=[False, True])
fig_b = px.bar(
    company_counts,
    x="Company",
    y="Count",
    labels={"Count": "Mission count"},
)
fig_b.update_layout(
    template="plotly_white",
    xaxis_tickangle=-45,
    height=350,
)
st.plotly_chart(fig_b, use_container_width=True)

# --- Chart C: Launches by location ---
st.markdown("**C) Launches by location**")
loc_counts = filtered["Location"].value_counts().head(15).reset_index()
loc_counts.columns = ["Location", "Count"]
fig_c = px.bar(
    loc_counts,
    x="Location",
    y="Count",
    labels={"Count": "Launch count"},
)
fig_c.update_layout(
    template="plotly_white",
    xaxis_tickangle=-45,
    height=350,
)
st.plotly_chart(fig_c, use_container_width=True)

# --- Chart D: Mission status distribution ---
st.markdown("**D) Mission status distribution**")
status_counts = filtered["MissionStatus"].value_counts().reset_index()
status_counts.columns = ["Status", "Count"]
fig_d = px.pie(
    status_counts,
    values="Count",
    names="Status",
    color_discrete_sequence=px.colors.qualitative.Set2,
)
fig_d.update_layout(template="plotly_white", height=350)
st.plotly_chart(fig_d, use_container_width=True)
