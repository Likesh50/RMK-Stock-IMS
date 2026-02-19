// GlobalPrintStyles.js
import { createGlobalStyle } from 'styled-components';

const GlobalPrintStyles = createGlobalStyle`
  @media print {
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    table thead th {
      background-color: #3582ab; !important;
      color: #fff !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      border-top: 6px solid #164863 !important;
      border-bottom: 6px solid #164863 !important;
    }
    footer, .print-footer {
      background-color: #3582ab; !important;
      color: #fff !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      border-top: 6px solid #164863 !important;
    }
    thead th { position: static !important; }
    body { padding-bottom: 48px !important; }
    table th, table td { white-space: normal !important; }
  }
`;

export default GlobalPrintStyles;
