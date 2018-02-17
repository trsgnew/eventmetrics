<?php
/**
 * This file contains the abstract EntityController.
 */

namespace AppBundle\Controller;

use AppBundle\Model\Event;
use AppBundle\Model\Organizer;
use AppBundle\Model\Program;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

use Symfony\Component\HttpFoundation\RedirectResponse;

/**
 * The EntityController sets class-level properties and
 * provides methods shared amongst the ProgramController,
 * EventController, and EventDataController.
 * @abstract
 */
abstract class EntityController extends Controller
{
    /** @var EntityManagerInterface The Doctrine entity manager. */
    protected $em;

    /** @var Request The request object. */
    protected $request;

    /** @var Program The Program being requested. */
    protected $program;

    /** @var Event The Event being requested. */
    protected $event;

    /**
     * Constructor for the abstract EntityController.
     * @param RequestStack $requestStack
     * @param EntityManagerInterface $em
     */
    public function __construct(RequestStack $requestStack, EntityManagerInterface $em)
    {
        $this->em = $em;
        $this->request = $requestStack->getCurrentRequest();
        $this->setProgramAndEvent();
    }

    /**
     * Check the request and if there are parameters for eventTitle or programTitle,
     * find and set class properties for the corresponding entity.
     */
    private function setProgramAndEvent()
    {
        if ($programTitle = $this->request->get('programTitle')) {
            $this->program = $this->em->getRepository(Program::class)
                ->findOneBy(['title' => $programTitle]);
        }
        if ($eventTitle = $this->request->get('eventTitle')) {
            $this->event = $this->em->getRepository(Event::class)
                ->findOneBy([
                    'program' => $this->program,
                    'title' => $eventTitle,
                ]);
        }
    }

    /**
     * Get the Organizer based on username stored in the session.
     * @return Organizer
     */
    protected function getOrganizer()
    {
        $organizerRepo = $this->em->getRepository(Organizer::class);
        $organizerRepo->setContainer($this->container);
        return $organizerRepo->getOrganizerByUsername(
            $this->get('session')->get('logged_in_user')->username
        );
    }

    /**
     * Is the logged in user an organizer of the given Program? This returns
     * true for admins, who are defined with the app.admins config parameter.
     * @param  Program $program
     * @return bool
     */
    protected function authUserIsOrganizer(Program $program)
    {
        $username = $this->get('session')->get('logged_in_user')->username;

        return in_array($username, $this->container->getParameter('app.admins')) ||
            in_array($username, $program->getOrganizerNames());
    }

    /**
     * Validates that the logged in user is an organizer of the given Program,
     * and if not throw an exception (they should never be able to navigate here).
     * @param  Program $program
     * @throws AccessDeniedHttpException
     */
    protected function validateOrganizer(Program $program)
    {
        if (!$this->authUserIsOrganizer($program)) {
            throw new AccessDeniedHttpException(
                'You are not an organizer of this program.'
            );
        }
    }
}
