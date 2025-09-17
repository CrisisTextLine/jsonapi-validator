#!/usr/bin/env python3
from PIL import Image, ImageDraw, ImageFont
import os

def create_comparison_image():
    try:
        # Load the screenshots
        valid_img = Image.open('/tmp/playwright-logs/valid-error-validation.png')
        invalid_img = Image.open('/tmp/playwright-logs/invalid-error-validation.png')
        
        # Calculate dimensions
        width = max(valid_img.width, invalid_img.width)
        height = valid_img.height + invalid_img.height + 120  # Extra space for headers
        
        # Create new image
        comparison = Image.new('RGB', (width, height), 'white')
        
        # Create drawing context
        draw = ImageDraw.Draw(comparison)
        
        # Try to use a better font, fall back to default if not available
        try:
            font_large = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 24)
            font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 16)
        except:
            font_large = ImageFont.load_default()
            font_small = ImageFont.load_default()
        
        # Add headers
        draw.text((20, 20), "JSON:API Error Object Structure Validation - UI Demo", 
                 fill='black', font=font_large)
        draw.text((20, 50), "Comprehensive validation of error responses per JSON:API v1.1 specification", 
                 fill='gray', font=font_small)
        
        # Add valid error section
        y_offset = 80
        draw.text((20, y_offset), "✅ VALID Error Response (404 Not Found)", 
                 fill='green', font=font_small)
        draw.text((20, y_offset + 20), "Shows detailed validation of all error object members", 
                 fill='gray', font=font_small)
        
        # Paste valid error screenshot
        comparison.paste(valid_img, (0, y_offset + 50))
        
        # Add invalid error section
        y_offset = y_offset + 50 + valid_img.height + 20
        draw.text((20, y_offset), "❌ INVALID Error Response (String instead of Object)", 
                 fill='red', font=font_small)
        draw.text((20, y_offset + 20), "Correctly detects and reports error object structure violations", 
                 fill='gray', font=font_small)
        
        # Paste invalid error screenshot
        comparison.paste(invalid_img, (0, y_offset + 50))
        
        # Save comparison
        comparison_path = '/tmp/playwright-logs/error-validation-comparison.png'
        comparison.save(comparison_path)
        print(f"Comparison image created: {comparison_path}")
        return comparison_path
        
    except Exception as e:
        print(f"Error creating comparison: {e}")
        return None

if __name__ == "__main__":
    create_comparison_image()
