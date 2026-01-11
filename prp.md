Here's the updated prompt:

---

**Create a Cold Calling Dashboard with the following requirements:**

1. **Data Source**: The CSV data should be embedded directly in the code as a string variable. Sample format:
```
site_url,business_name,industry,company_name,city,phone_number
https://ontariolitigationlawyers.com/toronto-civil-litigation/, Toronto Civil Litigation Lawyers - Powell Litigation,Law Firm,Toronto Civil Litigation Lawyers - Powell Litigation,"Toronto, ON",(437) 222-2234
```

2. **Card Display**: Show one business at a time in a clean card layout displaying:
   - Business Name (as header)
   - Company Name
   - Industry
   - City
   - Phone Number (formatted nicely)
   - Website URL (as a clickable link)

3. **Navigation**: 
   - "Previous" and "Next" buttons to move between businesses
   - Show current position (e.g., "Business 1 of 25,000")
   - Disable Previous on first business, disable Next on last business

4. **Progress Tracking**:
   - Automatically save which business I'm currently viewing using React state
   - When I reload the page, it should resume at the last business I was viewing
   - Persist progress across page reloads

5. **Styling**:
   - Use shadcn/ui components (Card, Button)
   - Clean, minimal design
   - Good spacing and readability
   - Icons for phone, location, industry, website

6. **Technical**:
   - React component
   - Use Papaparse to parse the embedded CSV string
   - Store progress so it persists on reload
   - Handle parsing errors gracefully

Make it simple and functional - I just need to quickly see business info and navigate through my list for cold calling.
