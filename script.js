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

  getDoc(doc(db, 'users', username)).then((doc) => {
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
    await setDoc(doc(db, 'users', username), {
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
    const userDoc = await getDoc(doc(db, 'users', username));
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
    await addDoc(collection(db, 'topics'), {
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
    await addDoc(collection(db, 'goals'), {
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
    const querySnapshot = await getDocs(collection(db, 'goals'));
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
    const goalRef = doc(db, 'goals', id);
    const goalDoc = await getDoc(goalRef);
    const goal = goalDoc.data();
    await updateDoc(goalRef, {
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
    await deleteDoc(doc(db, 'goals', id));
    renderGoals();
  } catch (error) {
    alert('Ошибка при удалении цели: ' + error.message);
  }
};

const saveShift = () => {
  const fio = document.getElementById('shiftFIO').value.trim();
  const shiftNumber = document.getElementById('shiftNumber').value;
  const shiftDate = document.getElementById('shiftDate').value;

  if (!fio || !shiftNumber || !shiftDate) return alert('Заполните все поля!');

  const transaction = db.transaction(['shifts'], 'readwrite');
  const store = transaction.objectStore('shifts');
  store.add({ fio, shiftNumber, shiftDate }).onsuccess = () => {
    renderShifts();
    resetShiftInputs();
  };
};

const resetShiftInputs = () => {
  document.getElementById('shiftFIO').value = '';
  document.getElementById('shiftNumber').value = '';
  document.getElementById('shiftDate').value = '';
};

const renderShifts = () => {
  const shiftList = document.getElementById('shiftList');
  shiftList.innerHTML = '';

  const transaction = db.transaction(['shifts'], 'readonly');
  const store = transaction.objectStore('shifts');
  store.getAll().onsuccess = (event) => {
    const shifts = event.target.result;
    shifts.forEach((shift) => {
      const shiftRow = document.createElement('tr');
      shiftRow.innerHTML = `
        <td>${shift.fio}</td>
        <td>${shift.shiftNumber}</td>
        <td>${shift.shiftDate}</td>
      `;
      shiftList.appendChild(shiftRow);
    });
  };
};

const renderShiftReport = () => {
  const shiftReportList = document.getElementById('shiftReportList');
  shiftReportList.innerHTML = '';

  const transaction = db.transaction(['shifts'], 'readonly');
  const store = transaction.objectStore('shifts');
  store.getAll().onsuccess = (event) => {
    const shifts = event.target.result;
    shifts.forEach((shift) => {
      const shiftRow = document.createElement('tr');
      shiftRow.innerHTML = `
        <td>${shift.fio}</td>
        <td>${shift.shiftNumber}</td>
        <td>${shift.shiftDate}</td>
      `;
      shiftReportList.appendChild(shiftRow);
    });
  };
};

const clearShiftData = () => {
  const transaction = db.transaction(['shifts'], 'readwrite');
  const store = transaction.objectStore('shifts');
  store.clear().onsuccess = () => {
    renderShifts(); // Обновляем отображение после очистки
    alert('Данные успешно очищены!');
  };
};

const exportToExcel = () => {
  const transaction = db.transaction(['shifts'], 'readonly');
  const store = transaction.objectStore('shifts');
  store.getAll().onsuccess = (event) => {
    const shifts = event.target.result;
    const csvContent = "data:text/csv;charset=utf-8," 
      + shifts.map(shift => `${shift.fio},${shift.shiftNumber},${shift.shiftDate}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "shifts_report.csv");
    document.body.appendChild(link);
    link.click();
  };
};

const exportShiftsToExcel = () => {
  const transaction = db.transaction(['shifts'], 'readonly');
  const store = transaction.objectStore('shifts');
  store.getAll().onsuccess = (event) => {
    const shifts = event.target.result;

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
  };
};

const promoteUser  = () => {
  const username = document.getElementById('profileUsername').textContent;
  const transaction = db.transaction(['users'], 'readwrite');
  const store = transaction.objectStore('users');
  store.get(username).onsuccess = (event) => {
    const user = event.target.result;
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
    store.put(user).onsuccess = () => {
      alert('Звание повышено!');
      showProfilePage(username); // Обновляем страницу профиля
    };
  };
};

const demoteUser  = () => {
  const username = document.getElementById('profileUsername').textContent;
  const transaction = db.transaction(['users'], 'readwrite');
  const store = transaction.objectStore('users');
  store.get(username).onsuccess = (event) => {
    const user = event.target.result;
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
    store.put(user).onsuccess = () => {
      alert('Звание понижено!');
      showProfilePage(username); // Обновляем страницу профиля
    };
  };
};

window.onload = () => {
  initDB();
};
