// Имитация функции extractDomain
function extractDomain(url) {
  try {
    return new URL(url).hostname;
  } catch (error) {
    return '';
  }
}

// Имитация функции validateClient
function validateClient(clientId, referer) {
  // Get the list of allowed clients from environment variables
  const allowedClients = process.env.ALLOWED_CLIENTS?.split(',') || [];
  
  // Check if the client ID is in the list of allowed clients
  if (!allowedClients.includes(clientId)) {
    console.log(`Client ID ${clientId} not in allowed clients:`, allowedClients);
    return false;
  }
  
  // Get the list of allowed domains for this client
  const envName = `CLIENT_${clientId}_DOMAINS`;
  console.log(`Environment variable name: ${envName}`);
  console.log(`Environment variable value: ${process.env[envName]}`);
  
  const allowedDomains = process.env[envName]?.split(',') || [];
  console.log(`Allowed domains for ${clientId}:`, allowedDomains);
  
  // Extract the domain from the referer
  const refererDomain = extractDomain(referer);
  console.log(`Referer domain: ${refererDomain}`);
  
  // Check if the domain is in the list of allowed domains
  const isAllowed = allowedDomains.includes(refererDomain);
  console.log(`Is domain allowed: ${isAllowed}`);
  return isAllowed;
}

// Тестирование
console.log('ALLOWED_CLIENTS:', process.env.ALLOWED_CLIENTS);
console.log('CLIENT_test_client_1_DOMAINS:', process.env.CLIENT_test_client_1_DOMAINS);
console.log('CLIENT_test_client_2_DOMAINS:', process.env.CLIENT_test_client_2_DOMAINS);

// Вывод всех переменных окружения
console.log('\nAll environment variables:');
Object.keys(process.env).forEach(key => {
  if (key.startsWith('CLIENT_')) {
    console.log(`${key}: ${process.env[key]}`);
  }
});

console.log('\nTest 1:');
console.log('validateClient(test_client_1, https://example.com):', validateClient('test_client_1', 'https://example.com'));
console.log('\nTest 2:');
console.log('validateClient(test_client_1, https://test.com/path):', validateClient('test_client_1', 'https://test.com/path'));
console.log('\nTest 3:');
console.log('validateClient(test_client_2, https://example.org):', validateClient('test_client_2', 'https://example.org'));
console.log('\nTest 4:');
console.log('validateClient(test_client_2, https://test.org/path):', validateClient('test_client_2', 'https://test.org/path')); 