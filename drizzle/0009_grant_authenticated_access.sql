-- Custom SQL migration file, put your code below! --
GRANT SELECT, INSERT, UPDATE, DELETE ON tenants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON opportunities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON meal_options TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON sign_ups TO authenticated;
