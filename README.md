# CodeVault – Snippet Manager for Developers

CodeVault is a lightweight web app to store, organize, and reuse code snippets efficiently.

## Features

- Add, edit, delete, and favorite snippets  
- Search snippets by title, language, or tags  
- Syntax highlighting for better readability  
- One-click copy to clipboard  

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript  
- **Backend:** Python 3.12, FastAPI  
- **Database:** MySQL 8.0  
- **Server:** Uvicorn  

## Getting Started

### Clone the Repository
```bash
git clone https://github.com/mosin-sayyed/CodeVault.git
cd CodeVault

### Create a Virtual Environment

```bash
python -m venv venv

###Activate the Virtual Environment
 venv\Scripts\activate

###Install Dependencies
pip install -r requirements.txt

### Run The Application
uvicorn backend.main:app --reload


