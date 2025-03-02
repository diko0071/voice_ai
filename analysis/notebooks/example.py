# %% [markdown]
# # Voice AI Analysis Example
#
# This notebook demonstrates how to use the analysis environment setup for the Voice AI project.
# It shows how to load environment variables and connect to external services like Supabase.

# %% [markdown]
# ## Environment Setup
#
# First, let's import the necessary libraries and set up the environment.

# %%
# Standard libraries
import sys

# Add the parent directory to the path to import env_loader
sys.path.append('..')
from env_loader import load_env_vars

# %% [markdown]
# ## Loading Environment Variables
#
# We can access environment variables from the project's `.env.local` file.
# This is useful for accessing API keys and other configuration values.

# %%
# Load all environment variables
env_vars = load_env_vars()

# Print available environment variables (showing only first few characters of sensitive values)
print("Available environment variables:")
for key in sorted(env_vars.keys()):
    value = env_vars[key]
    
    # For sensitive variables, show only first few characters
    if any(sensitive in key.upper() for sensitive in ['KEY', 'SECRET', 'PASSWORD', 'TOKEN']):
        # Show at most 30% of the key length, but at least 3 characters and at most 10
        visible_length = min(10, max(3, int(len(value) * 0.3)))
        if visible_length < len(value):
            masked_value = value[:visible_length] + "..." + "*" * (len(value) - visible_length)
        else:
            masked_value = value  # If the key is very short, just show it
        print(f"- {key}: {masked_value}")
    else:
        print(f"- {key}: {value}")

# %% [markdown]
# ## Connecting to Supabase
#
# In a real analysis notebook, we would connect to Supabase to access the Voice AI data.
# This would involve using the Supabase Python client and the API key from the environment variables.
#
# Example (not implemented yet):
# ```python
# from supabase import create_client
# from env_loader import get_env_var
# 
# supabase_url = get_env_var("SUPABASE_URL")
# supabase_key = get_env_var("SUPABASE_KEY")
# supabase = create_client(supabase_url, supabase_key)
# 
# # Query voice command data
# response = supabase.table("voice_commands").select("*").execute()
# ```
#
# We'll implement this in future notebooks as we develop the analysis pipeline.

# %% [markdown]
# ## Conclusion
#
# This notebook demonstrates the basic setup for accessing environment variables in the Voice AI project.
# You can use this as a template for your own analysis notebooks that need to access configuration values
# or connect to external services. 