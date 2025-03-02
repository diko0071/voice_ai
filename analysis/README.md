# Voice AI Analysis

This directory contains data analysis tools and resources for the Voice AI project.

## Purpose

The `analysis` directory is dedicated to data analysis, visualization, and insights generation for the Voice AI application. It serves as a space for:

- Analyzing voice command patterns and user interactions
- Generating insights from application usage data
- Creating visualizations to better understand user behavior
- Developing and testing machine learning models to enhance voice recognition
- Evaluating the performance of the voice assistant

## Structure

This directory will evolve organically as analysis needs arise. Initially, it contains:

- `requirements.txt` - Python dependencies
- `env_loader.py` - Environment variable loading utilities
- `notebooks/` - Jupyter notebooks in plain text format (`.py` files with `# %%` cell markers)
- `data/` - Data files for analysis
- `scripts/` - Python scripts for analysis

Additional files may be added as needed, potentially including:

- Visualization outputs
- Model training and evaluation code
- Data processing utilities

## Getting Started

To set up the Python environment for analysis:

1. Create a virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Unix/macOS
   # or
   .venv\Scripts\activate     # On Windows
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Using Jupyter Notebooks

This project uses plain text format for Jupyter notebooks (`.py` files with `# %%` cell markers) instead of the traditional `.ipynb` format. This approach offers several advantages:

1. **Better version control**: Plain text files are easier to diff and merge in Git
2. **Improved readability**: Code is more readable in plain text format
3. **IDE integration**: Works seamlessly with VS Code's Jupyter extension
4. **Flexibility**: Can be run as regular Python scripts or as notebooks

To work with these notebooks:

1. In VS Code, install the "Jupyter" extension
2. Open any `.py` file in the `notebooks/` directory
3. You'll see cell markers (`# %%`) that divide the code into executable cells
4. Use the "Run Cell" button that appears above each cell to execute it
5. Results appear in the interactive window, just like with traditional notebooks

Example of a notebook cell:
```python
# %% [markdown]
# ## This is a markdown cell
# It can contain formatted text

# %%
# This is a code cell
import pandas as pd
df = pd.DataFrame({'A': [1, 2, 3]})
df.head()  # This will display as output
```

## Using Environment Variables

The analysis code can access the same environment variables used by the main application:

1. Environment variables are loaded from the project root's `.env.local` file
2. Use the utility functions in `env_loader.py` to access them:

   ```python
   from env_loader import get_env_var
   
   # Get an environment variable with an optional default value
   openai_api_key = get_env_var("NEXT_PUBLIC_OPENAI_API_KEY")
   client_id = get_env_var("CLIENT_ID", "default_client")
   
   # Or load all environment variables as a dictionary
   from env_loader import load_env_vars
   
   env_vars = load_env_vars()
   openai_api_key = env_vars.get("NEXT_PUBLIC_OPENAI_API_KEY")
   ```

3. This ensures consistent configuration between the main application and analysis code

## Best Practices

When adding to this directory, please follow these guidelines:

1. Keep exploratory code separate from production code
2. Document analysis findings and methodologies
3. Use type hints in all Python code
4. Write tests for any reusable functions or modules
5. Keep data processing pipelines reproducible 