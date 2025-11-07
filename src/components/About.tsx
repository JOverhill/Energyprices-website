import './About.css'

export const About = () => {
  return (
    <main className="about-page">
      <div className="about-container">
        <section className="about-hero">
          <h1>Tietoa projektista</h1>
          <p className="about-subtitle">
            Reaaliaikainen pörssisähkön spot-hinta visualisoituna React-sovelluksessa
          </p>
        </section>

        <section className="about-section">
          <h2>📊 Sivustosta</h2>
          <p>
            Tämä sivusto näyttää Suomen pörssisähkön spot-hinnat reaaliajassa ENTSO-E
            Transparency Platform -rajapintaa hyödyntämällä. Hinnat päivittyvät automaattisesti
            ja pylväskaavio (Recharts) visualisoi hintakehityksen. Hintoihin sisältyy Suomen ALV (25.5%).
          </p>
        </section>

        <section className="about-section">
          <h2>🛠️ Teknologiat</h2>
          <div className="tech-grid">
            <div className="tech-card">
              <h3>Frontend</h3>
              <ul>
                <li>React 19.1.1</li>
                <li>TypeScript</li>
                <li>Vite</li>
                <li>Recharts</li>
                <li>React Router</li>
                <li>Typescript</li>
              </ul>
            </div>
            <div className="tech-card">
              <h3>Backend</h3>
              <ul>
                <li>Express.js</li>
                <li>JWT Authentication</li>
                <li>bcryptjs (salasanojen hajautus)</li>
                <li>TypeScript</li>
              </ul>
            </div>
            <div className="tech-card">
              <h3>API & Data</h3>
              <ul>
                <li>ENTSO-E Transparency Platform</li>
                <li>XML Parsing</li>
                <li>CSV Export</li>
                <li>Aikavyöhykkeen käsittely (EET/EEST)</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="about-section">
          <h2>✨ Ominaisuudet</h2>
          <div className="features-list">
            <div className="feature-item">
              <span className="feature-icon">📈</span>
              <div>
                <h3>Interaktiivinen kaavio</h3>
                <p>Pylväsdiagrammi hintakehityksestä - värit hinnan mukaan</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">⏰</span>
              <div>
                <h3>Nykyhetken korostus</h3>
                <p>Tämän hetken hintatieto merkitty selkeästi korostusvärillä</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">💾</span>
              <div>
                <h3>CSV-export</h3>
                <p>Lataa hintadata CSV-muodossa</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🔐</span>
              <div>
                <h3>Käyttäjähallinta</h3>
                <p>JWT-pohjainen autentikointi turvallisella tokenhallinnalla</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🌍</span>
              <div>
                <h3>Aikavyöhyke</h3>
                <p>Automaattinen UTC → Suomen aika -muunnos (EET/EEST)</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📱</span>
              <div>
                <h3>Responsiivinen</h3>
                <p>Toimii sujuvasti kaikilla laitteilla</p>
              </div>
            </div>
          </div>
        </section>

        <section className="about-section">
          <h2>👨‍💻 Minusta</h2>
          <p>
            Olen Junior-tason kehittäjä. Projekti on kehitetty tarkoituksena oppia uutta ja tuoda lisäystä omaan portfoliooni. Tavoitteena oli 
            luoda modernilla teknologiapinolla toteutettu full-stack sovellus, joka 
            ratkaisee käyttäjätarpeen ja tuoda esille osaamistani React-kehityksessä, 
            TypeScriptissä, API-integraatiossa ja backendin toteutuksessa.
          </p>
          <div className="about-links">
            <a 
              href="https://github.com/JOverhill/Energyprices-website" 
              target="_blank" 
              rel="noopener noreferrer"
              className="about-link"
            >
              <span>📁</span> GitHub Repo
            </a>
            <a 
              href="https://www.linkedin.com/in/jiriylimaki/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="about-link"
            >
              <span>👤</span> Linkedin
            </a>
          </div>
        </section>

        <section className="about-section about-footer">
          <p className="about-disclaimer">
            Copyright © Jiri Ylimäki 2025
          </p>
        </section>
      </div>
    </main>
  )
}
