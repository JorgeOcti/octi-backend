#!/bin/sh

echo "Ingresa la SSH URL del repositorio oficial de osa:"

read oficial

echo "Ingresa la SSH URL del repositorio fork de trabajo:"

read fork

git remote set-url origin $oficial

git remote set-url --push origin $fork
