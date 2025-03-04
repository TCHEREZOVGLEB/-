let currentUser = null;
let currentTopic = null;

// Показать страницу авторизации
const showAuthPage = () => {
  hideAllPages();
  document.getElementById('authPage').classList.remove('hidden');
};

// Показать страницу регистрации
const showRegisterPage = () => {
  hideAllPages();
  document.getElementById('registerPage').classList.remove('hidden');
};

// Показать основную страницу
const showMainPage = () => {
  hideAllPages();
  document.getElementById('mainPage').classList.remove('hidden');
};

// Показать страницу целей
const showTopicPage = (topicName) => {
  hideAllPages();
  document.getElementById('topicPage').classList.remove('hidden');
  document.getElementById('topicTitle').textContent = topicName;
  renderGoals();
};

// Показать страницу смен
const showShiftPage = () => {
  hideAllPages();
  document.getElementById('shiftPage').classList.remove('hidden');
  renderShifts();
};

// Показать страницу профиля
const showProfilePage = (username) => {
  hideAllPages();
  document.getElementById('profilePage').classList.remove('hidden');

  window.firebaseFunctions.getDoc(window.firebaseFunctions.doc(db, 'users', username)).then((doc) => {
    if (doc.exists()) {
      const user = doc.data();
      document.getElementById('profileUsername').textContent = user.username;
      document.getElementById('profileRole').textContent = user.role;
    }
  });
};

// Скрыть все страницы
const hideAllPages = () => {
  document.getElementById('authPage').classList.add('hidden');
  document.getElementById('registerPage').classList.add('hidden');
  document.getElementById('mainPage').classList.add('hidden');
  document.getElementById('topicPage').classList.add('hidden');
  document.getElementById('shiftPage').classList.add('hidden');
  document.getElementById('profilePage').classList.add('hidden');
};

// Регистрация пользователя
const register = async () => {
  const username = document.getElementById('regUsername').value.trim();
  const password = document.getElementById('regPassword').value.trim();
  const role = document.getElementById('regRole').value;

  if (!username || !password || !role) return alert('Заполните все поля!');

  try {
    await window.firebaseFunctions.setDoc(window.firebaseFunctions.doc(db, 'users', username), {
      username,
      password,
      role
    });
    alert('Регистрация успешна!');
    showAuthPage();
  } catch (error) {
    alert('Ошибка при регистрации: ' + error.message);
  }
};

// Авторизация пользователя
const login = async () => {
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value.trim();
  const role = document.getElementById('loginRole').value;

  if (!username || !password || !role) return alert('Заполните все поля!');

  try {
    const userDoc = await window.firebaseFunctions.getDoc(window.firebaseFunctions.doc(db, 'users', username));
    if (userDoc.exists()) {
      const user = userDoc.data();
      if (user.password === password && user.role === role) {
        currentUser = username;
        showMainPage();
      } else {
        alert('Неверное имя пользователя, пароль или должность!');
      }
    } else {
      alert('Пользователь не найден!');
    }
  } catch (error) {
    alert('Ошибка при авторизации: ' + error.message);
  }
};

// Создание темы
const createTopic = async () => {
  const topicName = document.getElementById('topicName').value.trim();
  if (!topicName) return alert('Введите имя и фамилию!');

  try {
    await window.firebaseFunctions.addDoc(window.firebaseFunctions.collection(db, 'topics'), {
      name: topicName,
      user: currentUser
    });
    showTopicPage(topicName);
  } catch (error) {
    alert('Ошибка при создании темы: ' + error.message);
  }
};

// Добавление цели
const addGoal = async () => {
  const goalText = document.getElementById('newGoal').value.trim();
  const goalDescription = document.getElementById('goalDescription').value.trim();
  const goalProgress = parseInt(document.getElementById('newGoalProgress').value, 10);

  if (!goalText) return alert('Введите цель!');
  if (isNaN(goalProgress) || goalProgress < 0 || goalProgress > 100) {
    return alert('Введите процент выполнения от 0 до 100!');
  }

  try {
    await window.firebaseFunctions.addDoc(window.firebaseFunctions.collection(db, 'goals'), {
      topicName: currentTopic,
      text: goalText,
      description: goalDescription,
      progress: goalProgress,
      completed: false,
      createdBy: currentUser
    });
    renderGoals();
    resetGoalInputs();
  } catch (error) {
    alert('Ошибка при добавлении цели: ' + error.message);
  }
};

// Отображение целей
const renderGoals = async () => {
  const goalsList = document.getElementById('goalsList');
  goalsList.innerHTML = '';

  try {
    const querySnapshot = await window.firebaseFunctions.getDocs(window.firebaseFunctions.collection(db, 'goals'));
    querySnapshot.forEach((doc) => {
      const goal = doc.data();
      const goalRow = document.createElement('tr');
      goalRow.className = `goal ${goal.completed ? 'completed' : ''}`;
      goalRow.innerHTML = `
        <td>${goal.text}</td>
        <td>${goal.description}</td>
        <td>${goal.progress}%</td>
        <td>Создано пользователем: ${goal.createdBy}</td>
        <td>
          <button onclick="toggleGoal('${doc.id}')">${goal.completed ? 'Восстановить' : 'Закрыть'}</button>
          <button onclick="deleteGoal('${doc.id}')">Удалить</button>
        </td>
      `;
      goalsList.appendChild(goalRow);
    });
  } catch (error) {
    alert('Ошибка при загрузке целей: ' + error.message);
  }
};

// Переключение статуса цели
const toggleGoal = async (id) => {
  try {
    const goalRef = window.firebaseFunctions.doc(db, 'goals', id);
    const goalDoc = await window.firebaseFunctions.getDoc(goalRef);
    const goal = goalDoc.data();
    await window.firebaseFunctions.updateDoc(goalRef, {
      completed: !goal.completed
    });
    renderGoals();
  } catch (error) {
    alert('Ошибка при обновлении цели: ' + error.message);
  }
};

// Удаление цели
const deleteGoal = async (id) => {
  try {
    await window.firebaseFunctions.deleteDoc(window.firebaseFunctions.doc(db, 'goals', id));
    renderGoals();
  } catch (error) {
    alert('Ошибка при удалении цели: ' + error.message);
  }
};

// Остальные функции (saveShift, renderShifts, promoteUser, demoteUser и т.д.) можно переписать аналогично.
