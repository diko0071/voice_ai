"""Environment variable loader for the Voice AI analysis module.

This module provides functions to load environment variables from the project's
.env.local file, making configuration values accessible to analysis code.
"""

import os
from pathlib import Path
from typing import Dict, Optional

from dotenv import load_dotenv


def load_env_vars(env_file: Optional[str] = None) -> Dict[str, str]:
    """
    Load environment variables from .env.local file in the project root.
    
    Args:
        env_file: Optional path to the env file. If None, will look for .env.local
                 in the project root.
    
    Returns:
        Dictionary of environment variables loaded from the file.
    
    Example:
        >>> env_vars = load_env_vars()
        >>> openai_api_key = env_vars.get("NEXT_PUBLIC_OPENAI_API_KEY")
    """
    # Find the project root (where .env.local is located)
    current_dir = Path(__file__).parent
    project_root = current_dir.parent
    
    # Default to .env.local in project root if not specified
    env_path = env_file if env_file else project_root / ".env.local"
    
    # Load the environment variables
    load_dotenv(env_path)
    
    # Return a dictionary of all environment variables
    return {key: value for key, value in os.environ.items()}


def get_env_var(name: str, default: Optional[str] = None) -> str:
    """
    Get an environment variable, with optional default value.
    
    Args:
        name: Name of the environment variable.
        default: Default value if the environment variable is not set.
    
    Returns:
        Value of the environment variable, or default if not set.
        
    Raises:
        ValueError: If the environment variable is not set and no default is provided.
    
    Example:
        >>> openai_api_key = get_env_var("NEXT_PUBLIC_OPENAI_API_KEY")
        >>> client_id = get_env_var("CLIENT_ID", "default_client")
    """
    # Ensure environment variables are loaded
    load_env_vars()
    
    value = os.environ.get(name)
    if value is None:
        if default is not None:
            return default
        raise ValueError(f"Environment variable '{name}' is not set and no default value was provided")
    
    return value 