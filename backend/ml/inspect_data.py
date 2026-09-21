import pandas as pd

# Load new dataset
df = pd.read_csv("data/creditguard_synthetic_credit_risk_dataset.csv")

print("\n========== DATASET SIZE ==========")
print(df.shape)

print("\n========== COLUMNS ==========")
print(df.columns.tolist())

print("\n========== DATA TYPES ==========")
print(df.dtypes)

print("\n========== MISSING VALUES ==========")
print(df.isnull().sum())

print("\n========== TARGET ==========")
print(df["credit_risk"].value_counts())

print("\n========== TARGET PERCENTAGE ==========")
print(df["credit_risk"].value_counts(normalize=True) * 100)

print("\n========== FIRST 5 CUSTOMERS ==========")
print(df.head())

print("\n========== BASIC STATISTICS ==========")
print(df.describe())