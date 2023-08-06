export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  const formattedHours = hours.toString().padStart(2, '0');
  const formattedMinutes = minutes.toString().padStart(2, '0');
  const formattedSeconds = remainingSeconds.toString().padStart(2, '0');

  let formatted = `${formattedMinutes}:${formattedSeconds}`;

  if (hours > 0) {
    formatted = `${formattedHours}:${formatted}`;
  }

  return formatted;
}
