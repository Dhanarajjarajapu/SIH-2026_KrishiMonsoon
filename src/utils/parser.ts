import { ParsedKrishiSections } from '../types';

export function parseKrishiResponse(text: string): ParsedKrishiSections {
  if (!text) {
    return { isStructured: false, otherText: '' };
  }

  // Regex patterns to capture the 4 core sections
  const currentRegex = /(?:\[Current Weather\]|\*\*\[Current Weather\]\*\*|###?\s*Current Weather|\[वर्तमान मौसम\])[:\s]*([\s\S]*?)(?=(?:\[Monsoon Outlook\]|\*\*\[Monsoon Outlook\]\*\*|###?\s*Monsoon Outlook|\[Forecast\]|\*\*\[Forecast\]\*\*|\[Alerts|\*\*\[Alerts)|$)/i;
  
  const outlookRegex = /(?:\[Monsoon Outlook\]|\*\*\[Monsoon Outlook\]\*\*|###?\s*Monsoon Outlook|\[Forecast\]|\*\*\[Forecast\]\*\*|\[मानसून परिदृश्य\])[:\s]*([\s\S]*?)(?=(?:\[Risk Map\/Probabilities\]|\*\*\[Risk Map\/Probabilities\]\*\*|\[Risk Map\]|\*\*\[Risk Map\]\*\*|###?\s*Risk Map|\[Alerts\/Warnings\]|\*\*\[Alerts\/Warnings\]\*\*|\[Alerts\])|$)/i;
  
  const riskMapRegex = /(?:\[Risk Map\/Probabilities\]|\*\*\[Risk Map\/Probabilities\]\*\*|\[Risk Map\]|\*\*\[Risk Map\]\*\*|###?\s*Risk Map|\[Alerts\/Warnings\]|\*\*\[Alerts\/Warnings\]\*\*|\[Alerts\])[:\s]*([\s\S]*?)(?=(?:\[Agronomic Advisory\]|\*\*\[Agronomic Advisory\]\*\*|\[Advisory\/Decision Support\]|\*\*\[Advisory\/Decision Support\]\*\*|\[Advisory\]|###?\s*Agronomic Advisory|\[कृषि सलाह\])|$)/i;
  
  const advisoryRegex = /(?:\[Agronomic Advisory\]|\*\*\[Agronomic Advisory\]\*\*|\[Advisory\/Decision Support\]|\*\*\[Advisory\/Decision Support\]\*\*|\[Advisory\]|###?\s*Agronomic Advisory|\[कृषि सलाह\])[:\s]*([\s\S]*?)(?=(?:\[Language:)|$)/i;

  const currentMatch = text.match(currentRegex);
  const outlookMatch = text.match(outlookRegex);
  const riskMapMatch = text.match(riskMapRegex);
  const advisoryMatch = text.match(advisoryRegex);

  const currentWeather = currentMatch ? currentMatch[1].trim() : undefined;
  const monsoonOutlook = outlookMatch ? outlookMatch[1].trim() : undefined;
  const riskMap = riskMapMatch ? riskMapMatch[1].trim() : undefined;
  const agronomicAdvisory = advisoryMatch ? advisoryMatch[1].trim() : undefined;

  const isStructured = Boolean(currentWeather || monsoonOutlook || riskMap || agronomicAdvisory);

  let otherText = '';
  if (!isStructured) {
    otherText = text.trim();
  }

  return {
    currentWeather,
    monsoonOutlook,
    riskMap,
    agronomicAdvisory,
    otherText,
    isStructured,
  };
}
