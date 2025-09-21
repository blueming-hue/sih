# Mock Data for Digital Psychological Intervention System

This directory contains mock data and seeding scripts for testing and development of the Digital Psychological Intervention System.

## Files

- `sample_data.js` - JavaScript mock data for frontend testing
- `seed_database.py` - Python script to populate Firestore with mock data
- `README.md` - This documentation file

## Usage

### Frontend Testing with sample_data.js

```javascript
import { mockUsers, mockAppointments, mockForumPosts } from './mock_data/sample_data.js';

// Use mock data in your React components
const [users, setUsers] = useState(mockUsers);
const [appointments, setAppointments] = useState(mockAppointments);
```

### Database Seeding with seed_database.py

1. **Set up environment:**
   ```bash
   cd mock_data
   pip install -r ../python_backend/requirements.txt
   ```

2. **Configure environment variables:**
   ```bash
   cp ../python_backend/env_example.txt .env
   # Edit .env with your Firebase configuration
   ```

3. **Run the seeding script:**
   ```bash
   python seed_database.py
   ```

## Mock Data Structure

### Users
- **Students**: 50 mock student profiles with realistic college information
- **Counsellors**: 10 mock counsellor profiles with specializations
- **Admins**: System administrator accounts

### Appointments
- 100 mock appointments with various statuses
- Different session types (video, phone, in-person)
- Realistic scheduling and urgency levels

### Forum Posts
- 50 mock forum posts across different categories
- Anonymous usernames and realistic content
- Engagement metrics (likes, comments)

### Journal Entries
- 200 mock journal entries with mood tracking
- Various emotional states and topics
- Timestamps spanning several months

### Resources
- 30 mock educational resources
- Different types (articles, videos, audio)
- Categorized by mental health topics

### Assessments
- 100 mock PHQ-9 and GAD-7 assessments
- Realistic scoring and severity levels
- Personalized recommendations

## Data Characteristics

### Realistic Demographics
- Age range: 18-25 (typical college students)
- Gender distribution: Balanced representation
- College years: All levels represented
- Interests: Diverse academic and personal interests

### Mental Health Scenarios
- **Anxiety**: Exam stress, social anxiety, general worry
- **Depression**: Mood fluctuations, academic pressure, social isolation
- **Sleep Issues**: Insomnia, irregular sleep patterns
- **Academic Stress**: Exam pressure, assignment overload, time management

### Engagement Patterns
- **Active Users**: Regular journal entries and forum participation
- **Moderate Users**: Occasional app usage and resource access
- **New Users**: Recent registrations with minimal activity

## Customization

### Adding New Mock Data

1. **Extend sample_data.js:**
   ```javascript
   export const mockNewData = [
     {
       id: 'item1',
       // ... your data structure
     }
   ];
   ```

2. **Update seed_database.py:**
   ```python
   def seed_new_data(self, count: int = 50):
       # Your seeding logic here
       pass
   ```

### Modifying Data Volume

Adjust the counts in the seeding script:

```python
# In seed_all() method
user_ids = self.seed_users(100)  # Increase from 50 to 100
self.seed_appointments(user_ids, counsellor_ids, 200)  # Increase from 100 to 200
```

## Testing Scenarios

### User Journey Testing
1. **New User Registration**: Test with various college email formats
2. **First Assessment**: Complete PHQ-9/GAD-7 with different severity levels
3. **Chatbot Interaction**: Test various emotional states and crisis scenarios
4. **Appointment Booking**: Test different counsellor availability
5. **Forum Participation**: Test anonymous posting and community interaction

### Edge Cases
- **Crisis Situations**: High-risk assessment scores and crisis keywords
- **High Volume**: Large numbers of concurrent users and appointments
- **Data Privacy**: Test anonymous interactions and data isolation
- **Performance**: Test with large datasets and complex queries

## Data Privacy & Ethics

### Anonymization
- All personal information is fictional
- No real names, addresses, or identifying information
- Generated data follows privacy best practices

### Mental Health Sensitivity
- Mock data represents realistic but not extreme scenarios
- Crisis situations are clearly marked as test data
- No triggering content in mock scenarios

### Compliance
- Data structure follows mental health data protection guidelines
- Mock assessments use standard scoring algorithms
- Resource content is generic and educational

## Troubleshooting

### Common Issues

1. **Firebase Connection Errors:**
   - Verify service account key is correct
   - Check Firestore security rules
   - Ensure proper environment variables

2. **Permission Denied:**
   - Verify service account has admin privileges
   - Check Firestore security rules
   - Ensure proper authentication

3. **Data Not Appearing:**
   - Check Firestore console for data
   - Verify collection names match
   - Check for any error messages in console

### Debugging

Enable verbose logging in the seeding script:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## Best Practices

### Development
- Use mock data for local development
- Don't commit real user data to version control
- Regularly update mock data to reflect new features

### Testing
- Test with various data volumes
- Include edge cases and error scenarios
- Validate data integrity and relationships

### Production
- Never use mock data in production
- Implement proper data validation
- Use real user data with proper consent

## Support

For issues with mock data or seeding:
- Check the main project documentation
- Review Firebase setup instructions
- Contact the development team

## License

This mock data is part of the Digital Psychological Intervention System and follows the same license terms.
