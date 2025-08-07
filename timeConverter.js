export function isMoreThan24HoursFromNow(timeString) {
    if(timeString.includes("day")) {
        // Extract the number of hours from the string
        const hours = parseInt(timeString.split(" ")[0], 10);
        // Calculate the time difference in milliseconds
        timeString = new Date(new Date().getTime() - hours * 24 * 60 * 60 * 1000);      
    }else if(timeString.includes("seconds")) {
        // Extract the number of seconds from the string
        const seconds = parseInt(timeString.split(" ")[0], 10);
        // Calculate the time difference in milliseconds
        timeString = new Date(new Date().getTime() - seconds * 1000);
    }else if(timeString.includes("minutes")) {
        // Extract the number of minutes from the string
        const minutes = parseInt(timeString.split(" ")[0], 10);
        // Calculate the time difference in milliseconds
        timeString = new Date(new Date().getTime() - minutes * 60 * 1000);
    }else if(timeString.includes("hours")) {
        // Extract the number of hours from the string
        const hours = parseInt(timeString.split(" ")[0], 10);
        // Calculate the time difference in milliseconds
        timeString = new Date(new Date().getTime() - hours * 60 * 60 * 1000);
    }
    
    // Get the current time
    // This will be used to compare with the time of the post
    const now = new Date();
    
    // Convert the timeString to a Date object
    // This will be used to check if the post is older than 24 hours
    const inputTime = new Date(timeString);
    
    // Calculate the difference in milliseconds
    // This will be used to determine if the post is older than 24 hours
    const diffMs = Math.abs(now - inputTime);
    
    // Check if the difference is more than 24 hours
    // This will return true if the post is older than 12 hours, false otherwise
    const twentyFourHoursMs = 20 * 60 * 60 * 1000;
    
    // Return true if the post is older than 24 hours, false otherwise
    // This will be used to skip posts that are older than 24 hours
    return diffMs > twentyFourHoursMs;
}


export function isMoreThan24HoursAgo(dateString) {
  const now = new Date();
  const inputTime = new Date(dateString);
  const diffMs = now - inputTime;
  const twentyFourHoursMs = 24 * 60 * 60 * 1000;
  return diffMs > twentyFourHoursMs;
}