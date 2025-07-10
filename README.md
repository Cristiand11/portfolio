# 🏥 Agenda Médica - Sistema de Agendamento Inteligente de Consultas

Sistema web para o agendamento inteligente de consultas médicas. O projeto visa **otimizar o gerenciamento de agendas** de clínicas, médicos e pacientes, evitando sobrecargas e reduzindo o absenteísmo.

---

## 📘 Resumo

A má gestão de agendas médicas prejudica o atendimento, gera desperdício de tempo e recursos, e afeta a qualidade dos serviços prestados. Este sistema busca combater esses problemas com tecnologia gratuita, acessível e inteligente, promovendo:

- Redução do absenteísmo
- Controle eficiente de horários
- Comunicação direta com os pacientes

---

## 🎯 Objetivo

- Evitar sobreposição de horários e faltas sem aviso
- Automatizar o controle de agendas médicas
- Promover agendamentos transparentes e rastreáveis
- Facilitar a comunicação clínica-paciente

---

## 🧩 Funcionalidades

### 👤 Perfis e Acessos

- **Administrador**: Cadastra médicos e visualiza relatórios
- **Médico**: Gerencia pacientes, auxiliares e agenda
- **Auxiliar**: Gerencia agendamentos e pacientes do médico
- **Paciente**: Solicita e gerencia consultas

### 📅 Gerenciamento de Consultas

- Cadastro e visualização de consultas futuras
- Cancelamento e reagendamento com regras de tempo
- Validação de conflitos na agenda
- Histórico completo de consultas por paciente

### 🔔 Notificações e Comunicação

- Envio de e-mails automáticos para lembretes
- Médicos e auxiliares podem se comunicar com pacientes

### 📊 Relatórios e Estatísticas

- Administradores visualizam relatórios de uso
- Médicos acessam estatísticas de sua agenda

---

## 🧱 Estrutura do Sistema

### Fluxo de Telas

✅ Telas específicas para cada perfil (Administrador, Médico, Auxiliar e Paciente), incluindo:

- Dashboards personalizados
- Cadastros e filtros por perfil
- Modal de confirmação e regras de negócio aplicadas

👉 Veja detalhes no [Fluxo de Telas dos Usuários](docs/fluxo-de-telas.pdf)

### Relacionamentos entre Entidades

- **1 Médico** ➝ N Auxiliares e N Pacientes  
- **1 Paciente** ➝ N Médicos  
- **1 Auxiliar** ➝ 1 Médico (obrigatoriamente)

👉 Veja mais no [Relacionamento das Entidades](docs/relacionamentos.pdf)

---

## 💻 Stack Tecnológica

| Camada       | Tecnologia                         |
|--------------|-------------------------------------|
| Front-end    | React.js + TailwindCSS              |
| Back-end     | Node.js + Express.js                |
| Banco de Dados | PostgreSQL (via Supabase)          |
| Hospedagem   | Vercel                              |
| CI/CD        | GitHub Actions                      |
| Notificações | Resend API                          |

---

## ⚙️ Requisitos Técnicos

### Requisitos Funcionais (exemplos)

- Cadastro e login por perfil
- Gerenciamento de consultas com restrições de horário
- Envio de notificações
- Histórico de atendimentos

### Requisitos Não Funcionais

- Segurança: JWT, bcrypt, SQL Injection e XSS protection
- Web-only: 100% online, sem app mobile
- Compatível com: Chrome, Firefox e Edge
- Performance: Resposta em até 3s

---

## 🛡️ Segurança

- Autenticação via JWT
- Hash de senhas com `bcrypt`
- Proteção contra SQL Injection e XSS
- Backup automático via Supabase

---

## 🗺️ Roadmap

| Fase                        | Ferramentas            | Tempo Estimado |
|----------------------------|------------------------|----------------|
| Planejamento               | LucidChart             | 2 semanas      |
| Configuração Inicial       | Supabase, Vercel       | 2 semanas      |
| Cadastro de Usuários       | React, PostgreSQL      | 2 semanas      |
| Lógica de Agendamento      | Express, PostgreSQL    | 3 semanas      |
| Notificações               | Resend API             | 2 semanas      |
| Testes e Segurança         | Jest, Supabase Auth    | 2 semanas      |
| Deploy e Monitoramento     | Vercel, Grafana        | 2 semanas      |

---

## 📁 Organização do Código (em breve)

- `/frontend` — Interface React
- `/backend` — APIs Express
- `/docs` — Documentação auxiliar (PDFs, diagramas)
- `/tests` — Testes automatizados

---

## 📚 Referências

- [Supabase Docs](https://supabase.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Resend API](https://resend.com/docs)

---

## 🧾 Referências Bibliográficas

1. GONÇALVES, André Luiz et al. *Absenteísmo em consultas e exames especializados ambulatoriais no SUS*. Ciência & Saúde Coletiva, 2021.  
2. CARVALHO, Cássia Thaís et al. *Ausência de usuários agendados em consultas médicas em unidade de atenção primária à saúde*. Saúde em Debate, 2019.  
3. NASCIMENTO, Rafaela. *Um em cada três pacientes do SUS não aparece para consultas, exames e cirurgias*. Folha Vitória, 2023.

---

## 🧠 Autor

**Cristian Domingues**  
Centro Universitário Católica de Santa Catarina — Joinville  
2025

---

## 📜 Licença

Este projeto é livre para uso acadêmico e não possui fins comerciais.

