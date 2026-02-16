#!/bin/bash
set -e

# FitStudio Development Environment Script
# Usage: ./scripts/dev.sh [command]
#
# Commands:
#   start       Start the development environment (default)
#   stop        Stop all containers
#   restart     Restart all containers
#   logs        View logs
#   db          Start only database services
#   migrate     Run database migrations
#   studio      Start Prisma Studio
#   shell       Open a shell in the API container
#   clean       Remove all containers and volumes

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

COMMAND=${1:-start}

cd "$PROJECT_ROOT"

case $COMMAND in
  start)
    echo -e "${GREEN}🚀 Starting development environment...${NC}"
    docker-compose up -d postgres redis
    echo -e "${YELLOW}Waiting for services to be healthy...${NC}"
    sleep 5
    echo -e "${GREEN}✅ Development services started!${NC}"
    echo -e "${BLUE}PostgreSQL: localhost:5432${NC}"
    echo -e "${BLUE}Redis: localhost:6379${NC}"
    echo ""
    echo -e "${YELLOW}To start the API server:${NC}"
    echo -e "  cd server && npm run dev"
    echo ""
    echo -e "${YELLOW}Or start the full stack with:${NC}"
    echo -e "  docker-compose --profile full up"
    ;;

  stop)
    echo -e "${YELLOW}Stopping development environment...${NC}"
    docker-compose down
    echo -e "${GREEN}✅ Stopped!${NC}"
    ;;

  restart)
    echo -e "${YELLOW}Restarting development environment...${NC}"
    docker-compose restart
    echo -e "${GREEN}✅ Restarted!${NC}"
    ;;

  logs)
    docker-compose logs -f
    ;;

  db)
    echo -e "${GREEN}Starting database services...${NC}"
    docker-compose up -d postgres redis
    echo -e "${GREEN}✅ Database services started!${NC}"
    ;;

  migrate)
    echo -e "${YELLOW}Running database migrations...${NC}"
    docker-compose --profile migrate up migrate
    echo -e "${GREEN}✅ Migrations complete!${NC}"
    ;;

  studio)
    echo -e "${GREEN}Starting Prisma Studio...${NC}"
    docker-compose --profile tools up -d studio
    echo -e "${GREEN}✅ Prisma Studio available at http://localhost:5555${NC}"
    ;;

  shell)
    echo -e "${YELLOW}Opening shell in API container...${NC}"
    docker-compose --profile full exec api sh
    ;;

  clean)
    echo -e "${RED}⚠️  This will remove all containers and volumes!${NC}"
    read -p "Are you sure? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      docker-compose down -v --remove-orphans
      echo -e "${GREEN}✅ Cleaned!${NC}"
    else
      echo -e "${YELLOW}Cancelled.${NC}"
    fi
    ;;

  *)
    echo -e "${RED}Unknown command: $COMMAND${NC}"
    echo ""
    echo "Usage: ./scripts/dev.sh [command]"
    echo ""
    echo "Commands:"
    echo "  start       Start the development environment (default)"
    echo "  stop        Stop all containers"
    echo "  restart     Restart all containers"
    echo "  logs        View logs"
    echo "  db          Start only database services"
    echo "  migrate     Run database migrations"
    echo "  studio      Start Prisma Studio"
    echo "  shell       Open a shell in the API container"
    echo "  clean       Remove all containers and volumes"
    exit 1
    ;;
esac
