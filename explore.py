import pandas as pd

df = pd.read_csv('anemia.csv')

print("Shape:", df.shape)
print("\nFirst 5 rows:")
print(df.head())
print("\nColumn names:")
print(df.columns.tolist())
print("\nMissing values:")
print(df.isnull().sum())

print("\nAnemia vs No Anemia count:")
print(df['Result'].value_counts())

print("\nGender count:")
print(df['Gender'].value_counts())