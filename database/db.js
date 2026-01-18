require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('ERROR: SUPABASE_URL and SUPABASE_KEY must be set in .env file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('Supabase initialized successfully')

module.exports = supabase
