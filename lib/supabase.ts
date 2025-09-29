import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zemnfdtktrkuoikckebv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplbW5mZHRrdHJrdW9pa2NrZWJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNDcyNjksImV4cCI6MjA3NDcyMzI2OX0.ZaGJ7f7Lvnk0KYzHeQ0GvDOo1-SgvJSwaOy5-ylZxB4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);