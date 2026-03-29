from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def root():
    return {"message": "AI Service is running 🚀"} 

@app.get("/test")
def test():
    return {"status": "working"}