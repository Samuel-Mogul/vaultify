async function checkAuthentication() {
    const response = await fetch('/check-auth');
    const data = await response.json();
    return data.isAuthenticated;
  }
  
  // Function to fetch distinct years and months
  async function fetchDistinctYearsAndMonths() {
    try {
      const response = await fetch('/distinct-years-and-months');
      const data = await response.json();
  
      if (data.success) {
        return data;
      } else {
        throw new Error(data.message || 'Failed to fetch distinct years and months');
      }
    } catch (error) {
      throw new Error(`Failed to fetch distinct years and months: ${error.message}`);
    }
  }
  
  // Function to fetch filtered emails
  async function fetchFilteredEmails(year, month, searchTerm) {
    try {
      const response = await fetch(`/filter-emails?year=${year}&month=${month}&search=${searchTerm}`);
      const data = await response.json();
  
      if (data.success) {
        return data;
      } else {
        throw new Error(data.message || 'Failed to fetch filtered emails');
      }
    } catch (error) {
      throw new Error(`Failed to fetch filtered emails: ${error.message}`);
    }
  }
  
  // Function to display emails on the frontend
  function displayEmails(emails) {
    const emailsList = document.getElementById('emails-list');
    emailsList.innerHTML = '';
  
    if (!emails) {
      console.error('No emails found'); // Log an error if emails are undefined
      return;
    }
  
    emails.forEach(email => {
      const listItem = document.createElement('li');
      listItem.innerHTML = `
        <p><strong>Subject:</strong> ${email.subject}</p>
        <p><strong>Sender:</strong> ${email.sender}</p>
        <p><strong>Date:</strong> ${email.date}</p>
        <a href="/download/${email.id}" download>Download</a>
      `;
  
      emailsList.appendChild(listItem);
    });
  }
  
  // Check if running in a browser context before adding event listeners
  if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', async () => {
      const statusText = document.getElementById('status-text');
      const emailsList = document.getElementById('emails-list');
      const backupButton = document.getElementById('backup-button');
      const yearSelect = document.getElementById('year-select');
      const monthSelect = document.getElementById('month-select');
      const searchInput = document.getElementById('search-input');
      const filterButton = document.getElementById('filter-button');
  
      // Fetch distinct years and months and populate the dropdowns
      try {
        const distinctData = await fetchDistinctYearsAndMonths();
  
        if (distinctData.success) {
          const years = distinctData.years;
          const months = distinctData.months;
  
          // Populate year dropdown
          years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearSelect.appendChild(option);
          });
  
          // Populate month dropdown
          months.forEach(month => {
            const option = document.createElement('option');
            option.value = month;
            option.textContent = month;
            monthSelect.appendChild(option);
          });
        }
      } catch (error) {
        console.error(error.message);
      }
  
      backupButton.addEventListener('click', async () => {
        const isAuthenticated = await checkAuthentication();
  
        if (isAuthenticated) {
          statusText.textContent = 'Backing up...';
  
          try {
            // Perform Gmail backup logic here using the authenticated tokens
            const backupData = await fetchFilteredEmails('All', 'All', '');
  
            // Update status and results on success
            statusText.textContent = 'Idle';
            displayEmails(backupData.emails);
          } catch (error) {
            // Handle errors
            statusText.textContent = 'Idle';
            alert(`Backup failed: ${error.message}`);
          }
        } else {
          window.location.href = '/auth';
        }
      });
  
      filterButton.addEventListener('click', async () => {
        const selectedYear = yearSelect.value;
        const selectedMonth = monthSelect.value;
        const searchTerm = searchInput.value;
  
        try {
          const filteredData = await fetchFilteredEmails(selectedYear, selectedMonth, searchTerm);
  
          // Update results on success
          displayEmails(filteredData.emails);
        } catch (error) {
          // Handle errors
          alert(`Failed to fetch emails: ${error.message}`);
        }
      });
    });
  }
  