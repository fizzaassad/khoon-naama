import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import pickle

# Load data
df = pd.read_csv('anemia.csv')

# Separate features and target
X = df[['Gender', 'Hemoglobin', 'MCH', 'MCHC', 'MCV']]
y = df['Result']

# Split into training and testing
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

print("Training samples:", len(X_train))
print("Testing samples:", len(X_test))

# Build the model
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Test the model
predictions = model.predict(X_test)
accuracy = accuracy_score(y_test, predictions)

print("\nAccuracy:", round(accuracy * 100, 2), "%")
print("\nDetailed Report:")
print(classification_report(y_test, predictions, 
      target_names=['No Anemia', 'Anemia']))

# Save the model
with open('anemia_model.pkl', 'wb') as f:
    pickle.dump(model, f)

print("\nModel saved successfully!")