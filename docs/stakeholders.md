# Stakeholders

## Stakeholder Registry

### Restaurant Owner

| Attribute | Detail |
|-----------|--------|
| **Description** | Business owner who invests in the restaurant and defines strategic direction. May own a single location or a chain. |
| **Goals** | Maximize revenue, reduce operational costs, improve customer satisfaction, grow the business. |
| **Responsibilities** | Approve budget for software adoption, define business KPIs, evaluate ROI of the platform. |
| **System Interaction** | Reviews dashboards and reports. Does not perform daily operations. Configures high-level business settings. |
| **Priority** | Critical |

### Restaurant Manager

| Attribute | Detail |
|-----------|--------|
| **Description** | Operational leader responsible for daily restaurant operations, staff supervision, and customer experience. |
| **Goals** | Streamline operations, reduce no-shows, optimize table turnover, ensure staff adoption of the system. |
| **Responsibilities** | Configure restaurant settings, manage staff accounts, review performance reports, handle escalated customer issues. |
| **System Interaction** | Uses dashboard, reports, staff management, and settings modules daily. Moderate to high frequency. |
| **Priority** | Critical |

### Receptionist

| Attribute | Detail |
|-----------|--------|
| **Description** | Front-of-house staff who manages incoming reservations via phone, email, and walk-ins. The primary daily user of the system. |
| **Goals** | Book reservations quickly and accurately, avoid double-bookings, provide excellent first impression to guests. |
| **Responsibilities** | Create, modify, and cancel reservations. Assign tables. Check in guests. Answer customer inquiries about availability. |
| **System Interaction** | Heavy daily use of reservations, tables, and customer modules. High frequency. |
| **Priority** | High |

### Waiter / Waitstaff

| Attribute | Detail |
|-----------|--------|
| **Description** | Service staff who attend to guests during their dining experience. |
| **Goals** | Know table assignments, provide timely service, communicate table status changes. |
| **Responsibilities** | View assigned tables, update table status (seated, ready to clear), coordinate with reception on table readiness. |
| **System Interaction** | Light to moderate daily use. Primarily reads table status and updates occupancy state. |
| **Priority** | High |

### Customer / Diner

| Attribute | Detail |
|-----------|--------|
| **Description** | End user who books a table at the restaurant. The primary beneficiary of the service. |
| **Goals** | Easily find available tables, book quickly, receive confirmations, modify or cancel when needed. |
| **Responsibilities** | Provide accurate contact information, honor reservations or cancel in advance. |
| **System Interaction** | Low frequency. Uses self-service portal (future) or communicates through restaurant staff. |
| **Priority** | High |

### System Administrator

| Attribute | Detail |
|-----------|--------|
| **Description** | Technical administrator with full access across all organizations and branches. Maintains system health. |
| **Goals** | Ensure system security, availability, and performance. Manage global configuration. |
| **Responsibilities** | Create and manage organizations, review audit logs, perform backups, monitor system health, manage global settings. |
| **System Interaction** | Moderate daily use. Accesses admin panel, audit logs, user management, and system configuration. |
| **Priority** | Critical |

### Support Agent

| Attribute | Detail |
|-----------|--------|
| **Description** | Technical support staff who assists restaurant users with system issues and questions. |
| **Goals** | Resolve user issues quickly, maintain high customer satisfaction, reduce churn. |
| **Responsibilities** | Respond to support tickets, troubleshoot issues, escalate bugs to development team, document solutions. |
| **System Interaction** | Moderate daily use. Views restaurant configurations, user accounts, and audit logs for troubleshooting. |
| **Priority** | Medium |

### Product Owner

| Attribute | Detail |
|-----------|--------|
| **Description** | Owner of the product vision and backlog. Represents business stakeholders in the development process. |
| **Goals** | Deliver a product that meets market needs, prioritize features effectively, maximize business value. |
| **Responsibilities** | Define user stories, prioritize backlog, validate deliverables, communicate with stakeholders. |
| **System Interaction** | Low frequency. Reviews feature implementations and provides feedback. |
| **Priority** | High |

### Software Architect

| Attribute | Detail |
|-----------|--------|
| **Description** | Technical leader who defines the system architecture, technology stack, and design patterns. |
| **Goals** | Ensure scalable, maintainable, and secure architecture. Make sound technical decisions. |
| **Responsibilities** | Define system design, review code, establish coding standards, document architectural decisions. |
| **System Interaction** | Low frequency in the application itself. High involvement in design and documentation. |
| **Priority** | High |

### Developer

| Attribute | Detail |
|-----------|--------|
| **Description** | Software engineer who implements features and maintains the codebase. |
| **Goals** | Write clean, testable, efficient code. Deliver features on time. |
| **Responsibilities** | Develop frontend and backend features, write tests, review peer code, fix bugs. |
| **System Interaction** | Moderate. Uses the system during development and testing. |
| **Priority** | High |

### QA Engineer

| Attribute | Detail |
|-----------|--------|
| **Description** | Quality assurance professional who ensures the system meets requirements and quality standards. |
| **Goals** | Catch defects before production, ensure test coverage, maintain quality metrics. |
| **Responsibilities** | Design test plans, write and execute test cases, report bugs, verify fixes, perform regression testing. |
| **System Interaction** | Moderate to high during testing cycles. Uses all modules to validate functionality. |
| **Priority** | Medium |

### DevOps Engineer

| Attribute | Detail |
|-----------|--------|
| **Description** | Infrastructure specialist who manages deployment, CI/CD, monitoring, and system reliability. |
| **Goals** | Achieve 99.9% uptime, automate deployments, maintain infrastructure as code. |
| **Responsibilities** | Configure CI/CD pipelines, manage Docker and cloud infrastructure, monitor performance, handle incidents. |
| **System Interaction** | Low application usage. High interaction with infrastructure, monitoring, and deployment tools. |
| **Priority** | Medium |

### Business Analyst

| Attribute | Detail |
|-----------|--------|
| **Description** | Analyst who bridges business needs and technical requirements. |
| **Goals** | Ensure requirements are complete, clear, and aligned with business objectives. |
| **Responsibilities** | Gather requirements, document business processes, create functional specifications, support development team. |
| **System Interaction** | Low. Reviews features against documented requirements. |
| **Priority** | Medium |

### Investor

| Attribute | Detail |
|-----------|--------|
| **Description** | Financial stakeholder who provides capital and expects return on investment. |
| **Goals** | Achieve ROI, market adoption, revenue growth, exit strategy. |
| **Responsibilities** | Provide funding, evaluate business performance, strategic guidance. |
| **System Interaction** | None. Reviews business metrics through reports. |
| **Priority** | Low |

---

## Stakeholder Priority Matrix

| Priority | Stakeholders |
|----------|--------------|
| Critical | Restaurant Owner, Restaurant Manager, System Administrator |
| High | Receptionist, Waiter, Customer, Product Owner, Software Architect, Developer |
| Medium | Support Agent, QA Engineer, DevOps Engineer, Business Analyst |
| Low | Investor |
