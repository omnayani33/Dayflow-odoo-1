import random
import string
from django.contrib.auth import get_user_model

User = get_user_model()


def generate_random_password(length=10):
    """Generate a random password with letters, digits, and special characters"""
    characters = string.ascii_letters + string.digits + "!@#$%^&*"
    password = ''.join(random.choice(characters) for _ in range(length))
    return password


def generate_employee_id(company, first_name, last_name, year_of_joining):
    """
    Generate employee ID in format: OI[CompanyCode][NameCode][Year][SerialNum]
    Example: OIJODO20220001
    """
    # OI prefix (Odoo India or your app prefix)
    prefix = "OI"
    
    # Company code (first 2 letters of first 2 words or 4 letters if single word)
    words = company.name.split()
    if len(words) >= 2:
        company_code = (words[0][:2] + words[1][:2]).upper()
    else:
        company_code = company.name[:4].upper()
    
    # Name code (first 2 letters of first and last name)
    name_code = (first_name[:2] + last_name[:2]).upper()
    
    # Year
    year = str(year_of_joining)
    
    # Get serial number for this year in this company
    year_employees = User.objects.filter(
        company=company,
        year_of_joining=year_of_joining
    ).count()
    serial_num = str(year_employees + 1).zfill(4)
    
    return f"{prefix}{company_code}{name_code}{year}{serial_num}"
