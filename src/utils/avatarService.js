export const uploadAvatar = async (file, userId) => {
  try {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  } catch (err) {
    console.error("Failed to upload avatar:", err);
    return null;
  }
};

export const saveAvatarUrl = async (userId, url) => {
  try {
    const users = JSON.parse(localStorage.getItem('ace_store_users') || '[]');
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      users[userIndex].avatar_url = url;
      localStorage.setItem('ace_store_users', JSON.stringify(users));
      
      // Update current user in storage if it's the same
      const currentUser = JSON.parse(localStorage.getItem('ace_store_user') || 'null');
      if (currentUser && currentUser.id === userId) {
        currentUser.avatar_url = url;
        localStorage.setItem('ace_store_user', JSON.stringify(currentUser));
      }
      return true;
    }
    return false;
  } catch (err) {
    console.error("Database update error:", err);
    return false;
  }
};
