-- ============================================================
-- SUPROVAL — Datos de ejemplo (seed)
-- 5 partes de prueba. Ejecuta este script DESPUÉS de schema.sql
-- y DESPUÉS de haber creado al menos un usuario.
--
-- El created_by se asigna automáticamente al primer perfil
-- existente. Las fechas son relativas a hoy para que puedas
-- ver el comportamiento de "retrasado" (más de 5 días).
-- ============================================================

do $$
declare
  v_uid uuid;
begin
  -- Tomamos el primer usuario existente como autor de los partes
  select id into v_uid from public.profiles order by created_at limit 1;

  insert into public.partes_taller
    (fecha, serie, cliente, telefono, id_maquina, tipo_maquina,
     estado_reparacion, delegacion, descripcion, material_utilizado,
     tiempo_trabajo, created_by)
  values
    (current_date - 1, 'SR-1001', 'Agrícola El Palmar S.L.', '+34 961 234 567',
     '005588-001', 'Tractor', 'En reparación', 'Suproval Cheste',
     'Ruido en la caja de cambios y pérdida de potencia.',
     'Rodamiento y aceite de transmisión', '2h 30min', v_uid),

    (current_date - 8, 'SR-1002', 'Construcciones Vera', '+34 963 111 222',
     '007712-004', 'Manipulador telescópico', 'Pendiente de reparar',
     'Suproval Aldaia',
     'Fuga hidráulica en el brazo telescópico.', null, null, v_uid),

    (current_date - 12, 'SR-1003', 'Hortalizas del Turia', '600123456',
     '004410-002', 'Miniexcavadora', 'Parado/Sin piezas', 'Suproval Cheste',
     'Cadena de oruga rota. A la espera de recambio del proveedor.',
     'Eslabones de cadena (pendiente)', null, v_uid),

    (current_date - 3, 'SR-1004', 'Bodegas Requena', '+34 962 300 400',
     '009921-010', 'Compresor', 'Reparado. Pte. entrega', 'Suproval Aldaia',
     'Sustitución de válvula y revisión general.',
     'Válvula de admisión y filtros', '1h 30min', v_uid),

    (current_date - 20, 'SR-1005', 'Transportes Gandía', '962555888',
     '003300-007', 'Carretilla', 'Entregado', 'Suproval Cheste',
     'Cambio de batería y mantenimiento preventivo.',
     'Batería 48V y líquido de frenos', '4h', v_uid);

  raise notice 'Seed completado con autor %', v_uid;
end $$;
