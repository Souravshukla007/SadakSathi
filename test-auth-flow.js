#!/usr/bin/env node

/**
 * Test script to verify the hard-coded authentication flow
 * Run this script to test the authentication system
 */

const BASE_URL = 'http://localhost:3000';

async function testAuthFlow() {
    console.log('🧪 Testing SadakSathi Authentication Flow\n');
    
    // Test 1: Test Municipal Authority Login
    console.log('1. Testing Municipal Authority Login...');
    try {
        const municipalRes = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'municipal-admin',
                password: 'municipal123',
                authorityType: 'municipal'
            })
        });
        
        const municipalData = await municipalRes.json();
        console.log(`   Status: ${municipalRes.status}`);
        console.log(`   Message: ${municipalData.message}`);
        console.log(`   Role: ${municipalData.role || 'N/A'}`);
        
        if (municipalRes.ok) {
            console.log('   ✅ Municipal login successful');
        } else {
            console.log('   ❌ Municipal login failed');
        }
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log('');
    
    // Test 2: Test Traffic Authority Login
    console.log('2. Testing Traffic Authority Login...');
    try {
        const trafficRes = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'traffic-officer',
                password: 'traffic123',
                authorityType: 'traffic'
            })
        });
        
        const trafficData = await trafficRes.json();
        console.log(`   Status: ${trafficRes.status}`);
        console.log(`   Message: ${trafficData.message}`);
        console.log(`   Role: ${trafficData.role || 'N/A'}`);
        
        if (trafficRes.ok) {
            console.log('   ✅ Traffic login successful');
        } else {
            console.log('   ❌ Traffic login failed');
        }
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log('');
    
    // Test 3: Test Invalid Credentials
    console.log('3. Testing Invalid Credentials...');
    try {
        const invalidRes = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'invalid-user',
                password: 'wrong-password',
                authorityType: 'municipal'
            })
        });
        
        const invalidData = await invalidRes.json();
        console.log(`   Status: ${invalidRes.status}`);
        console.log(`   Message: ${invalidData.message}`);
        
        if (!invalidRes.ok) {
            console.log('   ✅ Invalid credentials properly rejected');
        } else {
            console.log('   ❌ Invalid credentials were accepted');
        }
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log('');
    
    // Test 4: Test Regular Citizen Login
    console.log('4. Testing Regular Citizen Login...');
    try {
        const citizenRes = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'test@example.com',
                password: 'password123',
                authorityType: 'citizen'
            })
        });
        
        const citizenData = await citizenRes.json();
        console.log(`   Status: ${citizenRes.status}`);
        console.log(`   Message: ${citizenData.message}`);
        
        if (citizenRes.ok) {
            console.log('   ✅ Citizen login successful');
        } else {
            console.log('   ❌ Citizen login failed (expected if user doesn\'t exist)');
        }
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log('\n📋 Test Summary:');
    console.log('   - Municipal Authority: Use username "municipal-admin" and password "municipal123"');
    console.log('   - Traffic Authority: Use username "traffic-officer" and password "traffic123"');
    console.log('   - Regular Citizens: Use existing database credentials or Google OAuth');
    console.log('\n🚀 To test the full flow:');
    console.log('   1. Start the development server: npm run dev');
    console.log('   2. Visit http://localhost:3000/auth');
    console.log('   3. Select "Municipal Authority" or "Traffic Authority"');
    console.log('   4. Enter the credentials above');
    console.log('   5. You should be redirected to the respective dashboard');
}

// Run the test if this script is executed directly
if (require.main === module) {
    testAuthFlow().catch(console.error);
}

module.exports = { testAuthFlow };