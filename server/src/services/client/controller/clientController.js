import ResponseFormatter from "../../../shared/utils/responseFormatter.js";

export class ClientController {
    constructor(clientService, authService){
        if (!clientService) {
            throw new Error('ClientService is required');
        };

        if (!authService) {
            throw new Error('authService is required');
        };

        this.clientService = clientService;
        this.authService = authService;
    }

    async createClient(req, res, next){
        try {
            const isSuperAdmin = this.authService.checkSuperAdminPermissions(req.user.userId);
            if (!isSuperAdmin) {
                return res.status(403).json(ResponseFormatter.error("Access denied", 403))
            };

            const client = await this.clientService.createClient(req.body, req.user);
            res.status(201).json(ResponseFormatter.success(client, "Client created successfully"));
        } catch (error) {
            next(error)
        }
    }
    async createClientUser(req, res, next){
        try {
            const {clientId} = req.params;
            const user = await this.clientService.createClientUser(clientId, req.body, req.user);

            res.status(201).json(ResponseFormatter.success(user, "Client User created successfully"));

        } catch (error) {
            next(error)
        }
    }
    async createApiKey(req, res, next){
        try {
            const {clientId} = req.params;
            const apiKey = await this.clientService.createApiKey(clientId, req.body, req.user);

            res.status(201).json(ResponseFormatter.success(apiKey, "API Key created successfully"));

        } catch (error) {
            next(error)
        }
    }

    async getClientApiKeys(req, res,next){
        try {
            const {clientId} = req.params;
            const apiKeys = await this.clientService.getClientApiKeys(clientId, req.user);
            res.status(200).json(ResponseFormatter.success(apiKeys, "API Keys retrieved successfully", 200));
        } catch (error) {
            next(error)
        }
    }
}