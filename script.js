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
  currentTopic = topicName; // Обновляем текущую тему
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
      if (goal.topicName === currentTopic) { // Фильтруем цели по текущей теме
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
      }
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

// Сохранение смены
const saveShift = async () => {
  const fio = document.getElementById('shiftFIO').value.trim();
  const shiftNumber = document.getElementById('shiftNumber').value;
  const shiftDate = document.getElementById('shiftDate').value;

  if (!fio || !shiftNumber || !shiftDate) return alert('Заполните все поля!');

  try {
    await window.firebaseFunctions.addDoc(window.firebaseFunctions.collection(db, 'shifts'), {
      fio,
      shiftNumber,
      shiftDate
    });
    renderShifts();
    resetShiftInputs();
  } catch (error) {
    alert('Ошибка при сохранении смены: ' + error.message);
  }
};

// Отображение смен
const renderShifts = async () => {
  const shiftList = document.getElementById('shiftList');
  shiftList.innerHTML = '';

  try {
    const querySnapshot = await window.firebaseFunctions.getDocs(window.firebaseFunctions.collection(db, 'shifts'));
    querySnapshot.forEach((doc) => {
      const shift = doc.data();
      const shiftRow = document.createElement('tr');
      shiftRow.innerHTML = `
        <td>${shift.fio}</td>
        <td>${shift.shiftNumber}</td>
        <td>${shift.shiftDate}</td>
      `;
      shiftList.appendChild(shiftRow);
    });
  } catch (error) {
    alert('Ошибка при загрузке смен: ' + error.message);
  }
};

// Очистка данных смен
const clearShiftData = async () => {
  try {
    const querySnapshot = await window.firebaseFunctions.getDocs(window.firebaseFunctions.collection(db, 'shifts'));
    querySnapshot.forEach(async (doc) => {
      await window.firebaseFunctions.deleteDoc(window.firebaseFunctions.doc(db, 'shifts', doc.id));
    });
    renderShifts();
    alert('Данные успешно очищены!');
  } catch (error) {
    alert('Ошибка при очистке данных: ' + error.message);
  }
};

// Экспорт смен в Excel
const exportShiftsToExcel = async () => {
  try {
    const querySnapshot = await window.firebaseFunctions.getDocs(window.firebaseFunctions.collection(db, 'shifts'));
    const shifts = querySnapshot.docs.map(doc => doc.data());

    // Создаем CSV контент
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ФИО,Номер смены,Дата\n"; // Заголовки столбцов
    shifts.forEach(shift => {
      const row = `${shift.fio},${shift.shiftNumber},${shift.shiftDate}`;
      csvContent += row + "\n";
    });

    // Создаем ссылку для скачивания
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "shifts_report.csv");
    document.body.appendChild(link);
    link.click();
  } catch (error) {
    alert('Ошибка при экспорте данных: ' + error.message);
  }
};

// Повышение звания
const promoteUser = async () => {
  const username = document.getElementById('profileUsername').textContent;

  try {
    const userDoc = await window.firebaseFunctions.getDoc(window.firebaseFunctions.doc(db, 'users', username));
    if (userDoc.exists()) {
      const user = userDoc.data();
      if (user.role === 'сержант') {
        user.role = 'старший сержант';
      } else if (user.role === 'старший сержант') {
        user.role = 'капитан';
      } else if (user.role === 'капитан') {
        user.role = 'админ';
      } else {
        alert('Достигнуто максимальное звание!');
        return;
      }
      await window.firebaseFunctions.updateDoc(window.firebaseFunctions.doc(db, 'users', username), user);
      alert('Звание повышено!');
      showProfilePage(username);
    }
  } catch (error) {
    alert('Ошибка при повышении звания: ' + error.message);
  }
};

// Понижение звания
const demoteUser = async () => {
  const username = document.getElementById('profileUsername').textContent;

  try {
    const userDoc = await window.firebaseFunctions.getDoc(window.firebaseFunctions.doc(db, 'users', username));
    if (userDoc.exists()) {
      const user = userDoc.data();
      if (user.role === 'админ') {
        user.role = 'капитан';
      } else if (user.role === 'капитан') {
        user.role = 'старший сержант';
      } else if (user.role === 'старший сержант') {
        user.role = 'сержант';
      } else {
        alert('Достигнуто минимальное звание!');
        return;
      }
      await window.firebaseFunctions.updateDoc(window.firebaseFunctions.doc(db, 'users', username), user);
      alert('Звание понижено!');
      showProfilePage(username);
    }
  } catch (error) {
    alert('Ошибка при понижении звания: ' + error.message);
  }
};

// Инициализация при загрузке страницы
window.onload = () => {
  showAuthPage();
};
