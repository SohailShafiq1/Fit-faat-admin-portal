import axios from 'axios';
import { useState } from 'react';
import './DietPlanGenerator.css';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snacks'];

function DietPlanGenerator({ appointment, token, apiUrl, doctorData }) {
  const [planTitle, setPlanTitle] = useState('');
  const [weeklyMeals, setWeeklyMeals] = useState({});
  const [selectedDay, setSelectedDay] = useState('monday');
  const [selectedMeal, setSelectedMeal] = useState('breakfast');
  const [saving, setSaving] = useState(false);
  
  // Food input state
  const [foodName, setFoodName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fats, setFats] = useState('');

  const addFoodToMeal = () => {
    if (!foodName || !quantity || !calories) {
      alert('Please fill in food name, quantity, and calories');
      return;
    }

    const food = {
      foodName,
      quantity: parseFloat(quantity),
      calories: parseFloat(calories),
      protein: parseFloat(protein) || 0,
      carbs: parseFloat(carbs) || 0,
      fats: parseFloat(fats) || 0,
      baseQuantity: parseFloat(quantity),
      baseCalories: parseFloat(calories),
      baseProtein: parseFloat(protein) || 0,
      baseCarbs: parseFloat(carbs) || 0,
      baseFats: parseFloat(fats) || 0
    };

    setWeeklyMeals(prev => {
      const updated = { ...prev };
      if (!updated[selectedDay]) {
        updated[selectedDay] = {};
      }
      if (!updated[selectedDay][selectedMeal]) {
        updated[selectedDay][selectedMeal] = [];
      }
      updated[selectedDay][selectedMeal].push(food);
      return updated;
    });

    // Clear inputs
    setFoodName('');
    setQuantity('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFats('');
  };

  const removeFoodFromMeal = (day, mealType, index) => {
    setWeeklyMeals(prev => {
      const updated = { ...prev };
      if (updated[day] && updated[day][mealType]) {
        updated[day][mealType].splice(index, 1);
        if (updated[day][mealType].length === 0) {
          delete updated[day][mealType];
        }
        if (Object.keys(updated[day]).length === 0) {
          delete updated[day];
        }
      }
      return updated;
    });
  };

  const saveDietPlan = async () => {
    if (!planTitle.trim()) {
      alert('Please enter a plan title');
      return;
    }

    if (Object.keys(weeklyMeals).length === 0) {
      alert('Please add at least one meal to the plan');
      return;
    }

    try {
      setSaving(true);
      const response = await axios.post(
        `${apiUrl}/diet-plans/create`,
        {
          appointmentId: appointment._id,
          patientId: appointment.user._id,
          planTitle,
          weeklyMeals
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        alert('Diet plan created successfully!');
        // Reset form
        setPlanTitle('');
        setWeeklyMeals({});
        setSelectedDay('monday');
        setSelectedMeal('breakfast');
      }
    } catch (error) {
      console.error('Error saving diet plan:', error);
      alert(error.response?.data?.message || 'Failed to save diet plan');
    } finally {
      setSaving(false);
    }
  };

  const getMealIcon = (mealType) => {
    switch (mealType) {
      case 'breakfast': return '🌅';
      case 'lunch': return '🍽️';
      case 'dinner': return '🌙';
      case 'snacks': return '🍪';
      default: return '🍴';
    }
  };

  const getDayMeals = (day) => {
    return weeklyMeals[day] || {};
  };

  const getTotalNutrition = (day) => {
    const dayMeals = getDayMeals(day);
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFats = 0;

    Object.values(dayMeals).forEach(mealFoods => {
      mealFoods.forEach(food => {
        totalCalories += food.calories;
        totalProtein += food.protein;
        totalCarbs += food.carbs;
        totalFats += food.fats;
      });
    });

    return { totalCalories, totalProtein, totalCarbs, totalFats };
  };

  return (
    <div className="diet-plan-generator">
      <div className="diet-plan-header">
        <div>
          <h2>Create Diet Plan</h2>
          <p>For: {appointment.user?.firstName} {appointment.user?.lastName}</p>
        </div>
        <button onClick={saveDietPlan} disabled={saving} className="save-plan-button">
          {saving ? '💾 Saving...' : '💾 Save Diet Plan'}
        </button>
      </div>

      <div className="diet-plan-content">
        {/* Plan Title */}
        <div className="plan-title-section">
          <label>Plan Title *</label>
          <input
            type="text"
            value={planTitle}
            onChange={(e) => setPlanTitle(e.target.value)}
            placeholder="E.g., Weight Loss Plan, Muscle Building Plan"
            className="plan-title-input"
          />
        </div>

        {/* Day Selector */}
        <div className="day-selector">
          {DAYS.map(day => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`day-button ${selectedDay === day ? 'active' : ''}`}
            >
              <span className="day-name">{day.slice(0, 3)}</span>
              {getDayMeals(day).length !== undefined && (
                <span className="day-indicator">●</span>
              )}
            </button>
          ))}
        </div>

        {/* Day Summary */}
        <div className="day-summary">
          <h3>{selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)}</h3>
          <div className="nutrition-summary">
            {(() => {
              const nutrition = getTotalNutrition(selectedDay);
              return (
                <>
                  <div className="nutrition-item">
                    <span className="nutrition-icon">🔥</span>
                    <span className="nutrition-value">{Math.round(nutrition.totalCalories)}</span>
                    <span className="nutrition-label">cal</span>
                  </div>
                  <div className="nutrition-item">
                    <span className="nutrition-icon">🥩</span>
                    <span className="nutrition-value">{Math.round(nutrition.totalProtein)}</span>
                    <span className="nutrition-label">g protein</span>
                  </div>
                  <div className="nutrition-item">
                    <span className="nutrition-icon">🍞</span>
                    <span className="nutrition-value">{Math.round(nutrition.totalCarbs)}</span>
                    <span className="nutrition-label">g carbs</span>
                  </div>
                  <div className="nutrition-item">
                    <span className="nutrition-icon">🥑</span>
                    <span className="nutrition-value">{Math.round(nutrition.totalFats)}</span>
                    <span className="nutrition-label">g fats</span>
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        <div className="meals-layout">
          {/* Left: Meal Type Selector */}
          <div className="meal-selector">
            {MEAL_TYPES.map(mealType => (
              <button
                key={mealType}
                onClick={() => setSelectedMeal(mealType)}
                className={`meal-button ${selectedMeal === mealType ? 'active' : ''}`}
              >
                <span className="meal-icon">{getMealIcon(mealType)}</span>
                <span className="meal-name">{mealType}</span>
                {weeklyMeals[selectedDay]?.[mealType]?.length > 0 && (
                  <span className="meal-count">
                    {weeklyMeals[selectedDay][mealType].length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Right: Food Input & List */}
          <div className="meal-content">
            <div className="food-input-section">
              <h4>{getMealIcon(selectedMeal)} Add Food to {selectedMeal}</h4>
              <div className="food-input-grid">
                <input
                  type="text"
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  placeholder="Food name *"
                  className="food-input"
                />
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Quantity (g) *"
                  className="food-input"
                />
                <input
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  placeholder="Calories *"
                  className="food-input"
                />
                <input
                  type="number"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  placeholder="Protein (g)"
                  className="food-input"
                />
                <input
                  type="number"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                  placeholder="Carbs (g)"
                  className="food-input"
                />
                <input
                  type="number"
                  value={fats}
                  onChange={(e) => setFats(e.target.value)}
                  placeholder="Fats (g)"
                  className="food-input"
                />
              </div>
              <button onClick={addFoodToMeal} className="add-food-button">
                ➕ Add Food
              </button>
            </div>

            {/* Foods List */}
            <div className="foods-list">
              <h4>Foods in {selectedMeal}</h4>
              {weeklyMeals[selectedDay]?.[selectedMeal]?.length > 0 ? (
                weeklyMeals[selectedDay][selectedMeal].map((food, index) => (
                  <div key={index} className="food-card">
                    <div className="food-info">
                      <h5>{food.foodName}</h5>
                      <p>
                        {food.quantity}g • {food.calories} cal • {food.protein}g protein • 
                        {food.carbs}g carbs • {food.fats}g fats
                      </p>
                    </div>
                    <button
                      onClick={() => removeFoodFromMeal(selectedDay, selectedMeal, index)}
                      className="remove-food-button"
                    >
                      🗑️
                    </button>
                  </div>
                ))
              ) : (
                <div className="empty-meal">
                  <p>No foods added yet</p>
                  <span>Add foods using the form above</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DietPlanGenerator;
