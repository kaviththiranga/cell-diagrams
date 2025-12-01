/**
 * Monaco Editor Configuration
 */

export {
  LANGUAGE_ID,
  languageConfiguration,
  monarchTokensProvider,
  themeRules,
  registerCellDiagramsLanguage,
  defaultSampleCode,
} from './cellDiagramsLanguage';

export {
  startLanguageClient,
  stopLanguageClient,
  isLanguageClientRunning,
  notifyDocumentChange,
} from './languageClient';
