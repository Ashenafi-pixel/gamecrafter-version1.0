/**
 * Utility functions for dynamic paytable field management based on grid size
 */

export function getPaytableFields(reelCount: number): string[] {
  const fields = ['pay3']; // Always have pay3 as minimum
  
  if (reelCount >= 4) fields.push('pay4');
  if (reelCount >= 5) fields.push('pay5');
  if (reelCount >= 6) fields.push('pay6');
  if (reelCount >= 7) fields.push('pay7');
  
  return fields;
}

export function getPaytableFieldLabel(field: string): string {
  const match = field.match(/\d+/);
  return match ? `${match[0]}-of-kind` : field;
}

export function validatePaytableValue(
  field: string, 
  value: number, 
  currentPays: Record<string, number>
): boolean {
  const fieldNum = parseInt(field.replace('pay', ''));
  
  // Check against higher field (e.g., pay3 must be <= pay4)
  const higherField = `pay${fieldNum + 1}`;
  if (currentPays[higherField] !== undefined && value > currentPays[higherField]) {
    return false;
  }
  
  // Check against lower field (e.g., pay4 must be >= pay3)
  const lowerField = `pay${fieldNum - 1}`;
  if (currentPays[lowerField] !== undefined && value < currentPays[lowerField]) {
    return false;
  }
  
  return true; // Valid
}
