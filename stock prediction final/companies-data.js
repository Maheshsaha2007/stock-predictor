/**
 * Shared Indian equity universe for browse, portfolio, and dashboards.
 */
window.ALL_STOCKS = [
        // IT & Technology
        { ticker: 'TCS', name: 'Tata Consultancy Services Ltd', sector: 'IT', exchange: 'NSE' },
        { ticker: 'INFY', name: 'Infosys Ltd', sector: 'IT', exchange: 'NSE' },
        { ticker: 'WIPRO', name: 'Wipro Ltd', sector: 'IT', exchange: 'NSE' },
        { ticker: 'HCLTECH', name: 'HCL Technologies Ltd', sector: 'IT', exchange: 'NSE' },
        { ticker: 'TECHM', name: 'Tech Mahindra Ltd', sector: 'IT', exchange: 'NSE' },
        { ticker: 'LTIM', name: 'LTIMindtree Ltd', sector: 'IT', exchange: 'NSE' },
        { ticker: 'MPHASIS', name: 'MphasiS Ltd', sector: 'IT', exchange: 'NSE' },
        { ticker: 'COFORGE', name: 'Coforge Ltd', sector: 'IT', exchange: 'NSE' },
        { ticker: 'PERSISTENT', name: 'Persistent Systems Ltd', sector: 'IT', exchange: 'NSE' },
        { ticker: 'CYIENT', name: 'Cyient Ltd', sector: 'IT', exchange: 'NSE' },

        // Banking
        { ticker: 'HDFCBANK', name: 'HDFC Bank Ltd', sector: 'Banking', exchange: 'NSE' },
        { ticker: 'SBIN', name: 'State Bank of India', sector: 'Banking', exchange: 'NSE' },
        { ticker: 'ICICIBANK', name: 'ICICI Bank Ltd', sector: 'Banking', exchange: 'NSE' },
        { ticker: 'KOTAKBANK', name: 'Kotak Mahindra Bank Ltd', sector: 'Banking', exchange: 'NSE' },
        { ticker: 'AXISBANK', name: 'Axis Bank Ltd', sector: 'Banking', exchange: 'NSE' },
        { ticker: 'INDUSINDBK', name: 'IndusInd Bank Ltd', sector: 'Banking', exchange: 'NSE' },
        { ticker: 'BANKBARODA', name: 'Bank of Baroda', sector: 'Banking', exchange: 'NSE' },
        { ticker: 'PNB', name: 'Punjab National Bank', sector: 'Banking', exchange: 'NSE' },
        { ticker: 'FEDERALBNK', name: 'Federal Bank Ltd', sector: 'Banking', exchange: 'NSE' },
        { ticker: 'IDFCFIRSTB', name: 'IDFC First Bank Ltd', sector: 'Banking', exchange: 'NSE' },
        { ticker: 'CANBK', name: 'Canara Bank', sector: 'Banking', exchange: 'NSE' },
        { ticker: 'AUBANK', name: 'AU Small Finance Bank Ltd', sector: 'Banking', exchange: 'NSE' },
        { ticker: 'BANDHANBNK', name: 'Bandhan Bank Ltd', sector: 'Banking', exchange: 'NSE' },

        // Energy & Oil
        { ticker: 'RELIANCE', name: 'Reliance Industries Ltd', sector: 'Energy', exchange: 'NSE' },
        { ticker: 'ONGC', name: 'Oil & Natural Gas Corporation', sector: 'Energy', exchange: 'NSE' },
        { ticker: 'IOC', name: 'Indian Oil Corporation Ltd', sector: 'Energy', exchange: 'NSE' },
        { ticker: 'BPCL', name: 'Bharat Petroleum Corporation', sector: 'Energy', exchange: 'NSE' },
        { ticker: 'NTPC', name: 'NTPC Ltd', sector: 'Energy', exchange: 'NSE' },
        { ticker: 'POWERGRID', name: 'Power Grid Corporation', sector: 'Energy', exchange: 'NSE' },
        { ticker: 'ADANIGREEN', name: 'Adani Green Energy Ltd', sector: 'Energy', exchange: 'NSE' },
        { ticker: 'TATAPOWER', name: 'Tata Power Company Ltd', sector: 'Energy', exchange: 'NSE' },
        { ticker: 'ADANIPOWER', name: 'Adani Power Ltd', sector: 'Energy', exchange: 'NSE' },
        { ticker: 'GAIL', name: 'GAIL (India) Ltd', sector: 'Energy', exchange: 'NSE' },
        { ticker: 'COALINDIA', name: 'Coal India Ltd', sector: 'Energy', exchange: 'NSE' },

        // Automobile
        { ticker: 'TATAMOTORS', name: 'Tata Motors Ltd', sector: 'Auto', exchange: 'NSE' },
        { ticker: 'MARUTI', name: 'Maruti Suzuki India Ltd', sector: 'Auto', exchange: 'NSE' },
        { ticker: 'M&M', name: 'Mahindra & Mahindra Ltd', sector: 'Auto', exchange: 'NSE' },
        { ticker: 'BAJAJ-AUTO', name: 'Bajaj Auto Ltd', sector: 'Auto', exchange: 'NSE' },
        { ticker: 'HEROMOTOCO', name: 'Hero MotoCorp Ltd', sector: 'Auto', exchange: 'NSE' },
        { ticker: 'EICHERMOT', name: 'Eicher Motors Ltd', sector: 'Auto', exchange: 'NSE' },
        { ticker: 'ASHOKLEY', name: 'Ashok Leyland Ltd', sector: 'Auto', exchange: 'NSE' },
        { ticker: 'TVSMOTOR', name: 'TVS Motor Company Ltd', sector: 'Auto', exchange: 'NSE' },
        { ticker: 'BHARATFORG', name: 'Bharat Forge Ltd', sector: 'Auto', exchange: 'NSE' },
        { ticker: 'MRF', name: 'MRF Ltd', sector: 'Auto', exchange: 'NSE' },

        // FMCG
        { ticker: 'ITC', name: 'ITC Limited', sector: 'FMCG', exchange: 'NSE' },
        { ticker: 'HINDUNILVR', name: 'Hindustan Unilever Ltd', sector: 'FMCG', exchange: 'NSE' },
        { ticker: 'NESTLEIND', name: 'Nestlé India Ltd', sector: 'FMCG', exchange: 'NSE' },
        { ticker: 'BRITANNIA', name: 'Britannia Industries Ltd', sector: 'FMCG', exchange: 'NSE' },
        { ticker: 'DABUR', name: 'Dabur India Ltd', sector: 'FMCG', exchange: 'NSE' },
        { ticker: 'MARICO', name: 'Marico Ltd', sector: 'FMCG', exchange: 'NSE' },
        { ticker: 'GODREJCP', name: 'Godrej Consumer Products', sector: 'FMCG', exchange: 'NSE' },
        { ticker: 'COLPAL', name: 'Colgate-Palmolive India', sector: 'FMCG', exchange: 'NSE' },
        { ticker: 'TATACONSUM', name: 'Tata Consumer Products Ltd', sector: 'FMCG', exchange: 'NSE' },
        { ticker: 'VBL', name: 'Varun Beverages Ltd', sector: 'FMCG', exchange: 'NSE' },
        { ticker: 'EMAMILTD', name: 'Emami Ltd', sector: 'FMCG', exchange: 'NSE' },

        // Pharmaceutical
        { ticker: 'SUNPHARMA', name: 'Sun Pharmaceutical Industries', sector: 'Pharma', exchange: 'NSE' },
        { ticker: 'DRREDDY', name: "Dr. Reddy's Laboratories", sector: 'Pharma', exchange: 'NSE' },
        { ticker: 'CIPLA', name: 'Cipla Ltd', sector: 'Pharma', exchange: 'NSE' },
        { ticker: 'DIVISLAB', name: "Divi's Laboratories Ltd", sector: 'Pharma', exchange: 'NSE' },
        { ticker: 'APOLLOHOSP', name: 'Apollo Hospitals Enterprise', sector: 'Pharma', exchange: 'NSE' },
        { ticker: 'LUPIN', name: 'Lupin Ltd', sector: 'Pharma', exchange: 'NSE' },
        { ticker: 'AUROPHARMA', name: 'Aurobindo Pharma Ltd', sector: 'Pharma', exchange: 'NSE' },
        { ticker: 'BIOCON', name: 'Biocon Ltd', sector: 'Pharma', exchange: 'NSE' },
        { ticker: 'TORNTPHARM', name: 'Torrent Pharmaceuticals', sector: 'Pharma', exchange: 'NSE' },
        { ticker: 'MAXHEALTH', name: 'Max Healthcare Institute', sector: 'Pharma', exchange: 'NSE' },

        // Telecom
        { ticker: 'BHARTIARTL', name: 'Bharti Airtel Ltd', sector: 'Telecom', exchange: 'NSE' },
        { ticker: 'IDEA', name: 'Vodafone Idea Ltd', sector: 'Telecom', exchange: 'NSE' },
        { ticker: 'TATACOMM', name: 'Tata Communications Ltd', sector: 'Telecom', exchange: 'NSE' },
        { ticker: 'INDUSTOWER', name: 'Indus Towers Ltd', sector: 'Telecom', exchange: 'NSE' },

        // Infrastructure & Construction
        { ticker: 'LT', name: 'Larsen & Toubro Ltd', sector: 'Infra', exchange: 'NSE' },
        { ticker: 'ADANIENT', name: 'Adani Enterprises Ltd', sector: 'Infra', exchange: 'NSE' },
        { ticker: 'ADANIPORTS', name: 'Adani Ports & SEZ Ltd', sector: 'Infra', exchange: 'NSE' },
        { ticker: 'ULTRACEMCO', name: 'UltraTech Cement Ltd', sector: 'Infra', exchange: 'NSE' },
        { ticker: 'GRASIM', name: 'Grasim Industries Ltd', sector: 'Infra', exchange: 'NSE' },
        { ticker: 'SHREECEM', name: 'Shree Cement Ltd', sector: 'Infra', exchange: 'NSE' },
        { ticker: 'ACC', name: 'ACC Ltd', sector: 'Infra', exchange: 'NSE' },
        { ticker: 'AMBUJACEM', name: 'Ambuja Cements Ltd', sector: 'Infra', exchange: 'NSE' },
        { ticker: 'DLF', name: 'DLF Ltd', sector: 'Infra', exchange: 'NSE' },
        { ticker: 'GODREJPROP', name: 'Godrej Properties Ltd', sector: 'Infra', exchange: 'NSE' },
        { ticker: 'IRB', name: 'IRB Infrastructure Developers', sector: 'Infra', exchange: 'NSE' },

        // Financial Services (NBFC / Insurance)
        { ticker: 'BAJFINANCE', name: 'Bajaj Finance Ltd', sector: 'Finance', exchange: 'NSE' },
        { ticker: 'BAJAJFINSV', name: 'Bajaj Finserv Ltd', sector: 'Finance', exchange: 'NSE' },
        { ticker: 'HDFCLIFE', name: 'HDFC Life Insurance Co', sector: 'Finance', exchange: 'NSE' },
        { ticker: 'SBILIFE', name: 'SBI Life Insurance Co', sector: 'Finance', exchange: 'NSE' },
        { ticker: 'ICICIPRULI', name: 'ICICI Prudential Life Ins.', sector: 'Finance', exchange: 'NSE' },
        { ticker: 'MUTHOOTFIN', name: 'Muthoot Finance Ltd', sector: 'Finance', exchange: 'NSE' },
        { ticker: 'CHOLAFIN', name: 'Cholamandalam Investment', sector: 'Finance', exchange: 'NSE' },
        { ticker: 'SHRIRAMFIN', name: 'Shriram Finance Ltd', sector: 'Finance', exchange: 'NSE' },
        { ticker: 'PEL', name: 'Piramal Enterprises Ltd', sector: 'Finance', exchange: 'NSE' },
        { ticker: 'ICICIGI', name: 'ICICI Lombard General Ins.', sector: 'Finance', exchange: 'NSE' },

        // Metals & Mining
        { ticker: 'TATASTEEL', name: 'Tata Steel Ltd', sector: 'Metals', exchange: 'NSE' },
        { ticker: 'JSWSTEEL', name: 'JSW Steel Ltd', sector: 'Metals', exchange: 'NSE' },
        { ticker: 'HINDALCO', name: 'Hindalco Industries Ltd', sector: 'Metals', exchange: 'NSE' },
        { ticker: 'VEDL', name: 'Vedanta Ltd', sector: 'Metals', exchange: 'NSE' },
        { ticker: 'SAIL', name: 'Steel Authority of India', sector: 'Metals', exchange: 'NSE' },
        { ticker: 'NMDC', name: 'NMDC Ltd', sector: 'Metals', exchange: 'NSE' },
        { ticker: 'NATIONALUM', name: 'National Aluminium Co.', sector: 'Metals', exchange: 'NSE' },

        // Consumer Durables
        { ticker: 'TITAN', name: 'Titan Company Ltd', sector: 'Consumer', exchange: 'NSE' },
        { ticker: 'HAVELLS', name: 'Havells India Ltd', sector: 'Consumer', exchange: 'NSE' },
        { ticker: 'VOLTAS', name: 'Voltas Ltd', sector: 'Consumer', exchange: 'NSE' },
        { ticker: 'WHIRLPOOL', name: 'Whirlpool of India Ltd', sector: 'Consumer', exchange: 'NSE' },
        { ticker: 'CROMPTON', name: 'Crompton Greaves Consumer', sector: 'Consumer', exchange: 'NSE' },
        { ticker: 'BATAINDIA', name: 'Bata India Ltd', sector: 'Consumer', exchange: 'NSE' },
        { ticker: 'PAGEIND', name: 'Page Industries Ltd', sector: 'Consumer', exchange: 'NSE' },
        { ticker: 'RAJESHEXPO', name: 'Rajesh Exports Ltd', sector: 'Consumer', exchange: 'NSE' },

        // Chemicals
        { ticker: 'PIDILITIND', name: 'Pidilite Industries Ltd', sector: 'Chemicals', exchange: 'NSE' },
        { ticker: 'UPL', name: 'UPL Ltd', sector: 'Chemicals', exchange: 'NSE' },
        { ticker: 'SRF', name: 'SRF Ltd', sector: 'Chemicals', exchange: 'NSE' },
        { ticker: 'ATUL', name: 'Atul Ltd', sector: 'Chemicals', exchange: 'NSE' },
        { ticker: 'DEEPAKNTR', name: 'Deepak Nitrite Ltd', sector: 'Chemicals', exchange: 'NSE' },
        { ticker: 'NAVINFLUOR', name: 'Navin Fluorine International', sector: 'Chemicals', exchange: 'NSE' },

        // Defence & Aerospace
        { ticker: 'HAL', name: 'Hindustan Aeronautics Ltd', sector: 'Defence', exchange: 'NSE' },
        { ticker: 'BEL', name: 'Bharat Electronics Ltd', sector: 'Defence', exchange: 'NSE' },
        { ticker: 'BHEL', name: 'Bharat Heavy Electricals', sector: 'Defence', exchange: 'NSE' },
        { ticker: 'BDL', name: 'Bharat Dynamics Ltd', sector: 'Defence', exchange: 'NSE' },
        { ticker: 'COCHINSHIP', name: 'Cochin Shipyard Ltd', sector: 'Defence', exchange: 'NSE' },

        // Media & Entertainment
        { ticker: 'ZEEL', name: 'Zee Entertainment Enterprises', sector: 'Media', exchange: 'NSE' },
        { ticker: 'PVR', name: 'PVR INOX Ltd', sector: 'Media', exchange: 'NSE' },
        { ticker: 'NETWORK18', name: 'Network18 Media & Investments', sector: 'Media', exchange: 'NSE' },

        // Logistics & Transport
        { ticker: 'DELHIVERY', name: 'Delhivery Ltd', sector: 'Logistics', exchange: 'NSE' },
        { ticker: 'CONCOR', name: 'Container Corp. of India', sector: 'Logistics', exchange: 'NSE' },
        { ticker: 'IRCTC', name: 'Indian Railway Catering & Tourism', sector: 'Logistics', exchange: 'NSE' },

        // Miscellaneous / Conglomerates
        { ticker: 'HINDPETRO', name: 'Hindustan Petroleum Corp.', sector: 'Energy', exchange: 'NSE' },
        { ticker: 'JSWENERGY', name: 'JSW Energy Ltd', sector: 'Energy', exchange: 'NSE' },
        { ticker: 'NAUKRI', name: 'Info Edge (India) Ltd', sector: 'IT', exchange: 'NSE' },
        { ticker: 'PAYTM', name: 'One97 Communications (Paytm)', sector: 'Finance', exchange: 'NSE' },
        { ticker: 'ZOMATO', name: 'Zomato Ltd', sector: 'Consumer', exchange: 'NSE' },
        { ticker: 'POLICYBZR', name: 'PB Fintech (PolicyBazaar)', sector: 'Finance', exchange: 'NSE' },
        { ticker: 'NYKAA', name: 'FSN E-Commerce (Nykaa)', sector: 'Consumer', exchange: 'NSE' },
        { ticker: 'TRENT', name: 'Trent Ltd (Westside)', sector: 'Consumer', exchange: 'NSE' },
        { ticker: 'DMART', name: 'Avenue Supermarts (DMart)', sector: 'Consumer', exchange: 'NSE' },
        { ticker: 'INDIGO', name: 'InterGlobe Aviation (IndiGo)', sector: 'Logistics', exchange: 'NSE' },
        { ticker: 'SIEMENS', name: 'Siemens Ltd', sector: 'Infra', exchange: 'NSE' },
        { ticker: 'ABB', name: 'ABB India Ltd', sector: 'Infra', exchange: 'NSE' },
    ];
