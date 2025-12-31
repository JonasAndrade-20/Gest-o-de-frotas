
import { createClient } from '@supabase/supabase-js';

/**
 * Cliente Supabase para persistência de dados da frota.
 * URL e Chave Anonimizada.
 */
const SUPABASE_URL = 'https://biaqbdgnlkgcawmgphzt.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_7mxYheqmuV5WORCPi896HQ_s2voD5Ya';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
