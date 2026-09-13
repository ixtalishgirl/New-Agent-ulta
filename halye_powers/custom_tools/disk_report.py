import shutil
t = shutil.disk_usage("/")
print(f"total={t.total//(1024**3)}GB free={t.free//(1024**3)}GB")
