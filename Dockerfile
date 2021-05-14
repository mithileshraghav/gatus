# Build the react application 
FROM node:16.0.0-alpine3.13 as appbuilder
WORKDIR /app
ADD ui/public ./public
ADD ui/src ./src
ADD ui/package-lock.json ./
ADD ui/package.json ./
RUN mkdir ../static
RUN npm install
RUN npm run build

# Build the go application into a binary
FROM golang:alpine as builder
WORKDIR /app
ADD . ./
RUN CGO_ENABLED=0 GOOS=linux go build -mod vendor -a -installsuffix cgo -o gatus .
RUN apk --update add ca-certificates

# Run the binary on an empty container
FROM scratch
COPY --from=builder /app/gatus .
COPY --from=builder /app/config.yaml ./config/config.yaml
COPY --from=appbuilder /static static/
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt
ENV PORT=8080
EXPOSE ${PORT}
ENTRYPOINT ["/gatus"]