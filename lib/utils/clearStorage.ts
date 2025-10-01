// Utility to clear old/large localStorage items
export function clearOldStorage() {
  const keysToRemove = [
    'sleeper_players_data',
    'sleeper_players',
    'team-store', // Old team store
    'teamStore', // Old team store
  ];
  
  keysToRemove.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.log(`Could not remove ${key}`);
    }
  });
  
  // Log storage usage
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    navigator.storage.estimate().then(({usage, quota}) => {
      const percentUsed = (usage! / quota!) * 100;
      console.log(`Storage: ${percentUsed.toFixed(2)}% used of ${(quota! / 1024 / 1024).toFixed(2)} MB`);
    });
  }
}

// Run cleanup on page load
if (typeof window !== 'undefined') {
  clearOldStorage();
}