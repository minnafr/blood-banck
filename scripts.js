// Global variables
let token = localStorage.getItem('token');
let user = JSON.parse(localStorage.getItem('user'));
const API_URL = 'http://localhost:3000/api';

// Check if user is logged in
function checkAuth() {
  if (!token) {
    window.location.href = 'index.html';
  }
}

// Logout function
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'index.html';
}

// Format date function
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR');
}

// Load dashboard data
async function loadDashboardData() {
  try {
    const response = await fetch(`${API_URL}/statistics/dashboard`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      document.getElementById('totalStock').textContent = data.data.totalStock;
      document.getElementById('totalDistribution').textContent = data.data.totalDistribution;
    }
  } catch (error) {
    console.error('Error loading dashboard data:', error);
  }
}

// Load alerts
async function loadAlerts() {
  try {
    const response = await fetch(`${API_URL}/blood-bags/alerts/expiring`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      const alertsContainer = document.getElementById('Alertes');
      
      // Clear existing alerts
      alertsContainer.innerHTML = 'Les Alertes';
      
      // Add new alerts
      data.data.forEach(bag => {
        alertsContainer.innerHTML += `
          <div class="alert-box">
            N° de poche ${bag.bagbloodNumber} <span class="type">${bag.blood_group}</span><br><br>
            <small class="format-alert">${formatDate(bag.expireDate)}</small>
          </div>
        `;
      });
    }
  } catch (error) {
    console.error('Error loading alerts:', error);
  }
}

// Load detailed statistics
async function loadDetailedStats() {
  try {
    const response = await fetch(`${API_URL}/statistics/detailed`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      document.getElementById('totalPoCheSang').textContent = data.data.totalPoCheSang;
      document.getElementById('totalDistribution').textContent = data.data.totalDistribution;
      document.getElementById('totalExpire').textContent = data.data.totalExpire;
      document.getElementById('totalCps').textContent = data.data.totalCps;
      document.getElementById('totalCg').textContent = data.data.totalCg;
      document.getElementById('totalPfc').textContent = data.data.totalPfc;
    }
  } catch (error) {
    console.error('Error loading detailed statistics:', error);
  }
}

// Load biologists table
async function loadBiologists() {
  if (user.role !== 'chef') {
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/users/biologists`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      const tableBody = document.getElementById('tableauBiologiste');
      tableBody.innerHTML = '';
      
      data.data.forEach(biologist => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${biologist.biologist_id}</td>
          <td>${biologist.last_name}</td>
          <td>${biologist.first_name}</td>
          <td>${biologist.username}</td>
          <td>${biologist.email}</td>
          <td>${biologist.phonenumber || ''}</td>
          <td>
            <select id="Actif-${biologist.biologist_id}" disabled>
              <option>Oui</option>
              <option>Non</option>
            </select>
          </td>
          <td>
            <button onclick="editBiologist(${biologist.biologist_id})">✏️</button>
            <button onclick="deleteBiologist(${biologist.biologist_id})">❌</button>
          </td>
        `;
        tableBody.appendChild(row);
      });
    }
  } catch (error) {
    console.error('Error loading biologists:', error);
  }
}

// Edit biologist
async function editBiologist(id) {
  const row = document.querySelector(`#Actif-${id}`).closest('tr');
  const editButton = row.querySelector('button:first-child');
  const isEditing = editButton.textContent === '✏️';
  
  if (isEditing) {
    // Enable editing
    const inputs = row.querySelectorAll('td:not(:last-child):not(:first-child)');
    inputs.forEach(td => {
      const text = td.textContent;
      td.innerHTML = `<input type="text" value="${text}" />`;
    });
    
    const select = row.querySelector('select');
    select.removeAttribute('disabled');
    
    editButton.textContent = '💾';
    editButton.style.backgroundColor = 'lightgreen';
    editButton.style.color = 'black';
  } else {
    // Save changes
    const inputValues = row.querySelectorAll('input');
    const data = {
      lastName: inputValues[0].value,
      firstName: inputValues[1].value,
      username: inputValues[2].value,
      email: inputValues[3].value,
      phoneNumber: inputValues[4].value
    };
    
    try {
      const response = await fetch(`${API_URL}/users/biologists/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        // Update UI
        inputValues.forEach((input, index) => {
          input.parentElement.textContent = input.value;
        });
        
        const select = row.querySelector('select');
        select.setAttribute('disabled', true);
        
        editButton.textContent = '✏️';
        editButton.style.backgroundColor = 'white';
        editButton.style.color = '#a21218';
      } else {
        alert('Failed to update biologist');
      }
    } catch (error) {
      console.error('Error updating biologist:', error);
      alert('Error updating biologist');
    }
  }
}

// Delete biologist
async function deleteBiologist(id) {
  if (confirm('Are you sure you want to delete this biologist?')) {
    try {
      const response = await fetch(`${API_URL}/users/biologists/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        // Remove row from table
        document.querySelector(`#Actif-${id}`).closest('tr').remove();
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to delete biologist');
      }
    } catch (error) {
      console.error('Error deleting biologist:', error);
      alert('Error deleting biologist');
    }
  }
}

// Register new biologist
async function registerBiologist(event) {
  event.preventDefault();
  
  const form = document.querySelector('.right-panel-management > div');
  const inputs = form.querySelectorAll('input');
  
  const data = {
    lastName: inputs[0].value,
    firstName: inputs[1].value,
    username: inputs[2].value,
    email: inputs[3].value,
    password: inputs[4].value,
    phoneNumber: '' // This field is missing in the form
  };
  
  try {
    const response = await fetch(`${API_URL}/auth/register-biologist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert('Biologist registered successfully');
      inputs.forEach(input => input.value = '');
      loadBiologists();
    } else {
      alert(result.message || 'Failed to register biologist');
    }
  } catch (error) {
    console.error('Error registering biologist:', error);
    alert('Error registering biologist');
  }
}

// Event listeners for navigation
document.addEventListener("DOMContentLoaded", function() {
  checkAuth();
  
  const tableau = document.getElementById("tableau");
  const stats = document.getElementById("statistiques");
  const manag = document.getElementById("management");
  const tableauDeBord = document.getElementById("right-panel-tableau");
  const statistiques = document.getElementById("right-panel-statistiques");
  const managment = document.getElementById("right-panel-management");
  const compte = document.getElementById("compteBio");
  const cmpt = document.getElementById("compte-bio");
  
  // Load initial data
  loadDashboardData();
  loadAlerts();
  
  tableau.addEventListener('click', () => {
    tableau.style.color = "white";
    tableau.style.textDecoration = "underline";
    tableauDeBord.style.display = "block";
    statistiques.style.display = "none";
    compte.style.display = "none";
    managment.style.display = "none";
    
    if (cmpt) {
      cmpt.style.color = "";
      cmpt.style.textDecoration = "";
    }
    
    stats.style.color = "";
    stats.style.textDecoration = "";
    
    if (manag) {
      manag.style.color = "";
      manag.style.textDecoration = "";
    }
    
    loadDashboardData();
    loadAlerts();
  });
  
  stats.addEventListener('click', () => {
    stats.style.color = "white";
    stats.style.textDecoration = "underline";
    tableauDeBord.style.display = "none";
    statistiques.style.display = "block";
    managment.style.display = "none";
    compte.style.display = "none";
    
    if (cmpt) {
      cmpt.style.color = "";
      cmpt.style.textDecoration = "";
    }
    
    tableau.style.color = "";
    tableau.style.textDecoration = "";
    
    if (manag) {
      manag.style.color = "";
      manag.style.textDecoration = "";
    }
    
    loadDetailedStats();
  });
  
  if (manag) {
    manag.addEventListener('click', () => {
      manag.style.color = "white";
      manag.style.textDecoration = "underline";
      tableauDeBord.style.display = "none";
      statistiques.style.display = "none";
      managment.style.display = "block";
      compte.style.display = "none";
      
      if (cmpt) {
        cmpt.style.color = "";
        cmpt.style.textDecoration = "";
      }
      
      stats.style.color = "";
      stats.style.textDecoration = "";
      tableau.style.color = "";
      tableau.style.textDecoration = "";
    });
  }
  
  if (cmpt) {
    cmpt.addEventListener('click', () => {
      cmpt.style.color = "white";
      cmpt.style.textDecoration = "underline";
      tableauDeBord.style.display = "none";
      statistiques.style.display = "none";
      managment.style.display = "none";
      compte.style.display = "block";
      
      stats.style.color = "";
      stats.style.textDecoration = "";
      tableau.style.color = "";
      tableau.style.textDecoration = "";
      
      if (manag) {
        manag.style.color = "";
        manag.style.textDecoration = "";
      }
      
      loadBiologists();
    });
  }
  
  // Register form submission
  const registerButton = document.querySelector('.creer');
  if (registerButton) {
    registerButton.addEventListener('click', registerBiologist);
  }
  
  // Alert show more button
  const showMoreButton = document.getElementById("showMoreAlerts");
  const alerts = document.querySelectorAll(".alert-box");
  let visibleAlerts = 3;
  let isShowingMore = true;
  
  const updateAlertsVisibility = () => {
    alerts.forEach((alert, index) => {
      alert.style.display = index < visibleAlerts ? "block" : "none";
    });
    
    if (isShowingMore) {
      showMoreButton.textContent = "Afficher plus";
    } else {
      showMoreButton.textContent = "Afficher moins";
    }
    
    if (visibleAlerts >= alerts.length && isShowingMore) {
      showMoreButton.style.display = "none";
    } else {
      showMoreButton.style.display = "block";
    }
  };
  
  showMoreButton.addEventListener("click", () => {
    if (isShowingMore) {
      visibleAlerts = alerts.length;
      isShowingMore = false;
    } else {
      visibleAlerts = 3;
      isShowingMore = true;
    }
    updateAlertsVisibility();
  });
  
  updateAlertsVisibility();
});