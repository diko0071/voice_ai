# %% [markdown]
# # Supabase Connection Example
#
# This notebook demonstrates how to connect to Supabase and retrieve data from the `text_logs` table.

# %% [markdown]
# ## Environment Setup
#
# First, let's import the necessary libraries and set up the environment.

# %%
# Standard libraries
import sys
from typing import Dict, Any

# Data processing
import pandas as pd

# Add the parent directory to the path to import env_loader
sys.path.append("..")
from env_loader import get_env_var

# %% [markdown]
# ## Connecting to Supabase
#
# We will use the Supabase Python client to connect to our database and retrieve data.
# The connection credentials are stored in the project's `.env.local` file.

# %%
from supabase import create_client, Client

# Get Supabase credentials from environment variables
supabase_url: str = get_env_var("NEXT_PUBLIC_SUPABASE_URL")
supabase_key: str = get_env_var("NEXT_PUBLIC_SUPABASE_ANON_KEY")

# Create Supabase client
supabase: Client = create_client(supabase_url, supabase_key)

print(f"Successfully connected to Supabase at: {supabase_url}")

# %% [markdown]
# ## Retrieving Logs from the `text_logs` Table
#
# Now, let's retrieve the last 100 rows from the `text_logs` table.

# %%
# Query the text_logs table for the last 100 entries
response = (
    supabase.table("text_logs")
    .select("*")
    .order("created_at", desc=True)
    .limit(100)
    .execute()
)

# Convert the response to a pandas DataFrame
logs_data: list[Dict[str, Any]] = response.data
logs_df: pd.DataFrame = pd.DataFrame(logs_data)

# Display the number of retrieved records
print(f"Retrieved {len(logs_df)} records from the text_logs table.")

# %% [markdown]
# ## Exploring the Log Data
#
# Let's take a look at the structure and content of the retrieved logs.

# %%
# Display the first few rows of the DataFrame
print("First few rows of the logs:")
print(logs_df.head())

# %%
# Display basic statistics and column information
print("\nDataFrame information:")
print(logs_df.info())

# %%
# Display summary statistics for the DataFrame
print("\nSummary statistics:")
print(logs_df.describe(include="all"))

# %% [markdown]
# ## Filtering and Analyzing Log Data
#
# Now let's perform some basic analysis on the log data to demonstrate
# how to work with it.

# %%
# Group logs by type and count occurrences
logs_by_type = logs_df.groupby("type").size().reset_index(name="count")
print("Logs by type:")
print(logs_by_type)

# %%
# If there are transcriptions, let's look at those specifically
if "is_transcription" in logs_df.columns:
    transcriptions = logs_df[logs_df["is_transcription"] == True]
    print(f"\nNumber of transcriptions: {len(transcriptions)}")

    if not transcriptions.empty:
        print("\nSample transcriptions:")
        print(transcriptions[["session_id", "text", "created_at"]].head())

# %% [markdown]
# ## Saving the Data Locally
#
# If needed, we can save the retrieved data to a CSV file for further analysis.

# %%
# Save the DataFrame to a CSV file
# Use absolute path relative to the current file
import os

# Path to the data directory inside the analysis folder
data_dir = os.path.abspath(
    os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
)

# Check if the directory exists and create it if necessary
if not os.path.exists(data_dir):
    print(f"Creating directory: {data_dir}")
    os.makedirs(data_dir, exist_ok=True)

# Use .forgit suffix to include file in Git
csv_path = os.path.join(data_dir, "text_logs_sample.forgit.csv")

# Save DataFrame to CSV
logs_df.to_csv(csv_path, index=False)
print(f"Saved log data to {csv_path}")
print("Note: The file has a .forgit suffix, so it will be included in Git")

# %% [markdown]
# ## Conclusion
#
# This notebook demonstrates how to connect to Supabase, retrieve data from the `text_logs` table,
# and perform basic analysis on that data. You can extend this approach to work with other tables
# or perform more complex analyses.
