export const isValidEmail = (email?: string): boolean => {
  if (!email) return false;
  
  // Basic format check
  const basicRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!basicRegex.test(email)) return false;

  const domain = email.split('@')[1].toLowerCase();

  // Block common typos
  const invalidDomains = [
    'gamil.com',
    'gaml.com',
    'gmai.com',
    'gmal.com',
    'gmail.co',
    'gmail.con',
    'yaho.com',
    'yahooo.com',
    'yahom.com',
    'hotmai.com',
    'hotmal.com',
    'outlok.com',
  ];

  if (invalidDomains.includes(domain)) {
    return false;
  }

  // Ensure it ends with .com, .in, .org, .net, .co, etc., or .yolo
  return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email);
};
