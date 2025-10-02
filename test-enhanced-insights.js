// Quick test to verify our enhanced insights are working
const { enhancedInsightsService } = require('./lib/services/enhancedInsightsService.ts');

console.log('✅ Enhanced insights service loaded successfully!');
console.log('Available methods:', Object.getOwnPropertyNames(enhancedInsightsService.constructor.prototype).filter(name => name !== 'constructor'));