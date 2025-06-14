# Zap Browser Demo – FrontLabs

Welcome to the official demo site for exploring how the **Zap Browser** integrates with hostnames using protocol injections.

## 🚀 How to Use This Demo

Follow these steps to get started:

### 1. Install Zap Browser

Download and install the Zap Browser from the official [Link, which is to be updated after the release]().

After installation, go through the default setup as described on the homepage. This includes initial configuration and enabling core features required for injections to work.

### 2. Inject Permissions for the Demo Site

To allow the demo site to access Zap-injected features, follow these steps:

- Open the **Zap Browser**.
- Navigate to the **Injections** page.
- Add the following URL to inject permissions for the demo site:


This grants necessary permissions to the hostname: `demos.frontlabs.cloud`.

Or simply inject the permissions simply by pasting the [demo-permissions-link](https://raw.githubusercontent.com/Zap-browser/demo-zap-peer-ping-pong/refs/heads/main/injectionobject.json) in the url section of injection page.

### 3. Open the Demo Page [Demo ping-pong](https://demos.frontlabs.cloud/demo)

Once you've injected the permissions, simply visit the demo page in the Zap Browser:


You should now be able to interact with Zap-enabled features provided by the demo site.

## 🧠 How It Works

When the above domain is injected via the Zap Browser:

- Zap injects secure JavaScript APIs into the page's context.
- All this while Zap checks for the presence of necessary injection permissions and activates features accordingly.


## 🔐 Security Note

Only inject domains that you trust. Zap gives injected sites enhanced capabilities, so it's important to only use known and verified sources.

